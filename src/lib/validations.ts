import { z } from 'zod/v4';

// ─── Contact Form ─────────────────────────────────────────────────────
export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z.email('Please enter a valid email address'),
  subject: z
    .string()
    .max(200, 'Subject must be at most 200 characters')
    .optional(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be at most 5000 characters'),
});

export type ContactInput = z.infer<typeof contactSchema>;

// ─── AI Coach ─────────────────────────────────────────────────────────
export const aiCoachMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message is too long (max 4000 characters)'),
});

export const aiCoachRequestSchema = z.object({
  messages: z
    .array(aiCoachMessageSchema)
    .min(1, 'At least one message is required')
    .max(50, 'Conversation is too long. Please start a new session.'),
});

export type AiCoachInput = z.infer<typeof aiCoachRequestSchema>;

// ─── User Profile ─────────────────────────────────────────────────────
export const userProfileSchema = z.object({
  weight: z
    .number()
    .min(30, 'Weight must be at least 30 kg')
    .max(300, 'Weight must be at most 300 kg')
    .optional(),
  height: z
    .number()
    .min(100, 'Height must be at least 100 cm')
    .max(250, 'Height must be at most 250 cm')
    .optional(),
  goal: z.enum(['lose_weight', 'gain_muscle', 'stay_fit', 'improve_endurance']).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  weeklyGoal: z.number().min(1).max(7).optional(),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

// ─── Register / Login ─────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.email('Please enter a valid email address'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
