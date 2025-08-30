const winston = require('winston');
const { pool } = require('../config/database');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'green-hydrogen-api' },
  transports: [
    new winston.transports.File({ 
      filename: process.env.LOG_FILE || './logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: process.env.LOG_FILE || './logs/combined.log' 
    })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Audit logging function
const auditLog = async (userId, action, resourceType, resourceId, oldValues = null, newValues = null, req = null) => {
  try {
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      userId,
      action,
      resourceType,
      resourceId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      req?.ip || null,
      req?.get('User-Agent') || null
    ]);

    logger.info('Audit log created', {
      userId,
      action,
      resourceType,
      resourceId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to create audit log', {
      error: error.message,
      userId,
      action,
      resourceType,
      resourceId
    });
  }
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  next(error);
};

// Security event logging
const securityLog = (event, details, req = null) => {
  logger.warn('Security event', {
    event,
    details,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    userId: req?.user?.id,
    timestamp: new Date().toISOString()
  });
};

// Performance logging
const performanceLog = (operation, duration, metadata = {}) => {
  logger.info('Performance metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata,
    timestamp: new Date().toISOString()
  });
};

// Blockchain event logging
const blockchainLog = (event, transactionHash, blockNumber, gasUsed, metadata = {}) => {
  logger.info('Blockchain event', {
    event,
    transactionHash,
    blockNumber,
    gasUsed,
    ...metadata,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  logger,
  requestLogger,
  auditLog,
  errorLogger,
  securityLog,
  performanceLog,
  blockchainLog
};
