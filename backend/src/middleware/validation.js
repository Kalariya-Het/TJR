const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array()); // Added for debugging
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be 2-100 characters'),
  body('last_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be 2-100 characters'),
  body('role')
    .isIn(['producer', 'verifier', 'buyer', 'admin'])
    .withMessage('Invalid role'),
  body('wallet_address')
    .optional()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum address'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .notEmpty()
    .withMessage('Password required'),
  handleValidationErrors
];

// Producer validation rules
const validateProducerRegistration = [
  body('plant_id')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Plant ID must be 3-100 characters'),
  body('plant_name')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Plant name must be 3-255 characters'),
  body('location')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Location must be 3-255 characters'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be 2-100 characters'),
  body('renewable_source')
    .isIn(['Solar', 'Wind', 'Hydro', 'Geothermal', 'Biomass'])
    .withMessage('Invalid renewable source'),
  body('capacity_kg_per_month')
    .isInt({ min: 1, max: 1000000 })
    .withMessage('Capacity must be between 1 and 1,000,000 kg/month'),
  body('monthly_production_limit')
    .isNumeric()
    .withMessage('Monthly production limit must be numeric'),
  body('certification_body')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Certification body max 255 characters'),
  handleValidationErrors
];

// Production submission validation
const validateProductionSubmission = [
  body('plant_id')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Plant ID must be 3-100 characters'),
  body('amount')
    .isNumeric()
    .custom(value => {
      if (parseFloat(value) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    }),
  body('production_time')
    .isISO8601()
    .withMessage('Valid production time required')
    .custom(value => {
      const date = new Date(value);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      if (date > now) {
        throw new Error('Production time cannot be in the future');
      }
      if (date < thirtyDaysAgo) {
        throw new Error('Production data too old (max 30 days)');
      }
      return true;
    }),
  body('ipfs_hash')
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Valid IPFS hash required'),
  handleValidationErrors
];

// Verification validation
const validateVerification = [
  body('data_hash')
    .matches(/^0x[a-fA-F0-9]{64}$/)
    .withMessage('Valid data hash required'),
  body('is_valid')
    .isBoolean()
    .withMessage('Verification result must be boolean'),
  body('verification_notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Verification notes max 1000 characters'),
  handleValidationErrors
];

// Marketplace validation
const validateMarketplaceListing = [
  body('amount')
    .isNumeric()
    .custom(value => {
      if (parseFloat(value) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    }),
  body('price_per_credit')
    .isNumeric()
    .custom(value => {
      if (parseFloat(value) <= 0) {
        throw new Error('Price must be greater than 0');
      }
      return true;
    }),
  body('renewable_source')
    .optional()
    .isIn(['Solar', 'Wind', 'Hydro', 'Geothermal', 'Biomass'])
    .withMessage('Invalid renewable source'),
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Valid expiration date required')
    .custom(value => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    }),
  handleValidationErrors
];

// Credit retirement validation
const validateCreditRetirement = [
  body('amount')
    .isNumeric()
    .custom(value => {
      if (parseFloat(value) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    }),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Retirement reason must be 10-500 characters'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['created_at', 'updated_at', 'amount', 'production_time', 'price'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  handleValidationErrors
];

// ID parameter validation
const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Valid UUID required'),
  handleValidationErrors
];

const validateEthereumAddress = [
  param('address')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Valid Ethereum address required'),
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be 2-100 characters'),
  query('type')
    .optional()
    .isIn(['producer', 'verifier', 'submission', 'batch', 'transaction'])
    .withMessage('Invalid search type'),
  handleValidationErrors
];

// Date range validation
const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Valid start date required'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Valid end date required')
    .custom((value, { req }) => {
      if (value && req.query.start_date && new Date(value) <= new Date(req.query.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  handleValidationErrors
];

// Notification validation
const validateNotification = [
  body('type')
    .isIn(['production_verified', 'verification_pending', 'credit_issued', 'marketplace_sale', 'system_alert'])
    .withMessage('Invalid notification type'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be 5-255 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be 10-1000 characters'),
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
  handleValidationErrors
];

// API key validation
const validateApiKey = [
  body('key_name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Key name must be 3-100 characters'),
  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array')
    .custom(permissions => {
      const validPermissions = ['read', 'write', 'admin', 'producer', 'verifier'];
      const invalid = permissions.filter(p => !validPermissions.includes(p));
      if (invalid.length > 0) {
        throw new Error(`Invalid permissions: ${invalid.join(', ')}`);
      }
      return true;
    }),
  body('expires_at')
    .optional()
    .isISO8601()
    .withMessage('Valid expiration date required')
    .custom(value => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProducerRegistration,
  validateProductionSubmission,
  validateVerification,
  validateMarketplaceListing,
  validateCreditRetirement,
  validatePagination,
  validateUUID,
  validateEthereumAddress,
  validateSearch,
  validateDateRange,
  validateNotification,
  validateApiKey
};
