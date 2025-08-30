const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to ensure they still exist and are active
    const userResult = await pool.query(
      'SELECT id, email, role, wallet_address, is_active, is_verified FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Account deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(403).json({ 
      error: 'Invalid token',
      code: 'TOKEN_INVALID'
    });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: userRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Verify user is KYC verified
const requireKYCVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.is_verified) {
    return res.status(403).json({ 
      error: 'KYC verification required',
      code: 'KYC_REQUIRED'
    });
  }

  next();
};

// Verify wallet ownership
const verifyWalletOwnership = async (req, res, next) => {
  const { wallet_address } = req.body;
  
  if (!wallet_address) {
    return res.status(400).json({ 
      error: 'Wallet address required',
      code: 'WALLET_ADDRESS_REQUIRED'
    });
  }

  if (req.user.wallet_address && req.user.wallet_address.toLowerCase() !== wallet_address.toLowerCase()) {
    return res.status(403).json({ 
      error: 'Wallet address mismatch',
      code: 'WALLET_MISMATCH'
    });
  }

  next();
};

// API Key authentication (for external integrations)
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API key required',
      code: 'API_KEY_MISSING'
    });
  }

  try {
    const result = await pool.query(`
      SELECT ak.*, u.id as user_id, u.email, u.role, u.is_active
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.api_key = $1 AND ak.is_active = true AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
    `, [apiKey]);

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid or expired API key',
        code: 'API_KEY_INVALID'
      });
    }

    const apiKeyData = result.rows[0];
    
    if (!apiKeyData.is_active) {
      return res.status(401).json({ 
        error: 'User account deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Update last used timestamp
    await pool.query(
      'UPDATE api_keys SET last_used = NOW() WHERE id = $1',
      [apiKeyData.id]
    );

    req.user = {
      id: apiKeyData.user_id,
      email: apiKeyData.email,
      role: apiKeyData.role,
      is_active: apiKeyData.is_active
    };
    req.apiKey = apiKeyData;
    
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// Check API key permissions
const requireApiPermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({ 
        error: 'API key authentication required',
        code: 'API_KEY_REQUIRED'
      });
    }

    if (!req.apiKey.permissions || !req.apiKey.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient API permissions',
        code: 'INSUFFICIENT_API_PERMISSIONS',
        required: permission,
        available: req.apiKey.permissions
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireKYCVerification,
  verifyWalletOwnership,
  authenticateApiKey,
  requireApiPermission
};
