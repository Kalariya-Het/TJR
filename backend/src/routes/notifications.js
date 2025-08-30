const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateNotification, validatePagination, validateUUID } = require('../middleware/validation');
const { auditLog } = require('../middleware/logging');

const router = express.Router();

// Get user's notifications
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const is_read = req.query.is_read;

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.user.id];

    if (is_read !== undefined) {
      query += ' AND is_read = $2';
      params.push(is_read === 'true');
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = is_read !== undefined 
      ? 'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = $2'
      : 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
    const countParams = is_read !== undefined ? [req.user.id, is_read === 'true'] : [req.user.id];
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      notifications: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      code: 'FETCH_NOTIFICATIONS_ERROR'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, validateUUID, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE notifications 
      SET is_read = true, read_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    res.json({
      message: 'Notification marked as read',
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      code: 'MARK_READ_ERROR'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE notifications 
      SET is_read = true, read_at = NOW()
      WHERE user_id = $1 AND is_read = false
      RETURNING COUNT(*)
    `, [req.user.id]);

    res.json({
      message: 'All notifications marked as read',
      updated_count: result.rowCount
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      code: 'MARK_ALL_READ_ERROR'
    });
  }
});

// Create notification (admin only)
router.post('/', authenticateToken, requireRole('admin'), validateNotification, async (req, res) => {
  try {
    const { user_id, type, title, message, data } = req.body;

    const result = await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user_id, type, title, message, JSON.stringify(data)]);

    await auditLog(
      req.user.id,
      'notification_created',
      'notification',
      result.rows[0].id,
      null,
      result.rows[0],
      req
    );

    res.status(201).json({
      message: 'Notification created successfully',
      notification: result.rows[0]
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      error: 'Failed to create notification',
      code: 'CREATE_NOTIFICATION_ERROR'
    });
  }
});

module.exports = router;
