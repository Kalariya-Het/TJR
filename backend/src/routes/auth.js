const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { auditLog, securityLog } = require('../middleware/logging');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      walletAddress: user.wallet_address
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, wallet_address, company_name, phone } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR wallet_address = $2',
      [email, wallet_address]
    );

    if (existingUser.rows.length > 0) {
      securityLog('registration_attempt_duplicate', { email, wallet_address }, req);
      return res.status(409).json({
        error: 'User already exists with this email or wallet address',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, wallet_address, company_name, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, role, wallet_address, first_name, last_name, company_name, is_active, is_verified, kyc_status, created_at
    `, [email, passwordHash, first_name, last_name, role, wallet_address, company_name, phone]);

    const user = result.rows[0];
    const token = generateToken(user);

    // Log successful registration
    await auditLog(user.id, 'user_registered', 'user', user.id, null, { email, role }, req);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        wallet_address: user.wallet_address,
        first_name: user.first_name,
        last_name: user.last_name,
        company_name: user.company_name,
        is_active: user.is_active,
        is_verified: user.is_verified,
        kyc_status: user.kyc_status,
        created_at: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const result = await pool.query(
      'SELECT id, email, password_hash, role, wallet_address, first_name, last_name, company_name, is_active, is_verified, kyc_status FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      securityLog('login_attempt_invalid_email', { email }, req);
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      securityLog('login_attempt_inactive_account', { email }, req);
      return res.status(401).json({
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      securityLog('login_attempt_invalid_password', { email }, req);
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);

    // Log successful login
    await auditLog(user.id, 'user_login', 'user', user.id, null, { email }, req);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        wallet_address: user.wallet_address,
        first_name: user.first_name,
        last_name: user.last_name,
        company_name: user.company_name,
        is_active: user.is_active,
        is_verified: user.is_verified,
        kyc_status: user.kyc_status
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, email, role, wallet_address, first_name, last_name, company_name, phone,
             is_active, is_verified, kyc_status, created_at, updated_at, last_login
      FROM users WHERE id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      code: 'PROFILE_FETCH_ERROR'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, company_name, phone } = req.body;
    const userId = req.user.id;

    // Get current user data for audit log
    const currentUser = await pool.query(
      'SELECT first_name, last_name, company_name, phone FROM users WHERE id = $1',
      [userId]
    );

    // Update user profile
    const result = await pool.query(`
      UPDATE users 
      SET first_name = $1, last_name = $2, company_name = $3, phone = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING id, email, role, wallet_address, first_name, last_name, company_name, phone,
                is_active, is_verified, kyc_status, created_at, updated_at
    `, [first_name, last_name, company_name, phone, userId]);

    // Log profile update
    await auditLog(
      userId, 
      'profile_updated', 
      'user', 
      userId, 
      currentUser.rows[0], 
      { first_name, last_name, company_name, phone }, 
      req
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!current_password || !new_password) {
      return res.status(400).json({
        error: 'Current password and new password required',
        code: 'MISSING_PASSWORDS'
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Get current password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!isValidPassword) {
      securityLog('password_change_invalid_current', { userId }, req);
      return res.status(401).json({
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Log password change
    await auditLog(userId, 'password_changed', 'user', userId, null, null, req);

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const newToken = generateToken(user);

    // Log token refresh
    await auditLog(user.id, 'token_refreshed', 'user', user.id, null, null, req);

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
});

// Logout (client-side token invalidation)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Log logout
    await auditLog(req.user.id, 'user_logout', 'user', req.user.id, null, null, req);

    res.json({
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

module.exports = router;
