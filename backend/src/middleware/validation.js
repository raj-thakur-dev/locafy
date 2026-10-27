const { z } = require('zod');
const { formatError } = require('../utils/helpers');

function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const issues = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        return res.status(400).json(formatError('VALIDATION_ERROR', issues));
      }
      return res.status(400).json(formatError('VALIDATION_ERROR', 'Invalid request data'));
    }
  };
}

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Invalid phone number').max(20).optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'business'], { errorMap: () => ({ message: "Role must be 'user' or 'business'" }) })
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const businessCreateSchema = z.object({
  name: z.string().min(2, 'Business name is required').max(150),
  category_id: z.coerce.number().int().positive('Category is required'),
  description: z.string().max(2000).optional().nullable(),
  phone: z.string().min(7, 'Phone number is required').max(25),
  whatsapp: z.string().max(25).optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  address: z.string().min(5, 'Physical address is required').max(300),
  area: z.string().max(100).optional().nullable(),
  city: z.string().min(2, 'City is required').max(100),
  pincode: z.string().max(10).optional().nullable(),
  lat: z.coerce.number().min(-90).max(90, 'Invalid latitude'),
  lng: z.coerce.number().min(-180).max(180, 'Invalid longitude'),
  image_url: z.string().optional().nullable(),
  opening_hours_json: z.any().optional()
});

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().max(1000).optional().nullable()
});

const trackSchema = z.object({
  type: z.enum(['call', 'whatsapp', 'directions', 'view'], {
    errorMap: () => ({ message: "Type must be one of: 'call', 'whatsapp', 'directions', 'view'" })
  })
});

const messageSchema = z.object({
  name: z.string().min(2, 'Your name is required').max(100),
  phone: z.string().min(7, 'Phone number is required').max(25),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  body: z.string().min(5, 'Message body must be at least 5 characters').max(2000)
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  businessCreateSchema,
  reviewSchema,
  trackSchema,
  messageSchema
};
