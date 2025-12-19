const { z } = require('zod');

// Login validation
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Poster validation
const posterSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.enum(['service', 'event', 'theme']),
  imageUrl: z.string().min(1, 'Image is required'),
  description: z.string().optional(),
});

// Announcement validation
const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  icon: z.string().min(1, 'Icon is required'),
  badge: z.string().min(1, 'Badge is required'),
  badgeVariant: z.enum(['default', 'secondary', 'outline']),
});

// Event validation
const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().min(1, 'Image is required'),
});

// Helper function to validate and return errors
function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    };
  }
  return { valid: true, data: result.data };
}

module.exports = {
  loginSchema,
  posterSchema,
  announcementSchema,
  eventSchema,
  validate
};

