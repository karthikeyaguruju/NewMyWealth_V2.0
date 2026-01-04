import { z } from 'zod';

export const signupSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const transactionSchema = z.object({
    type: z.enum(['income', 'expense', 'investment']),
    categoryGroup: z.enum(['Income', 'Expense', 'Investment']),
    category: z.string().min(1, 'Category is required'),
    subCategory: z.string().optional(),
    amount: z.number().positive('Amount must be greater than 0'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    notes: z.string().optional(),
    categoryId: z.string().optional(),
});

export const categorySchema = z.object({
    categoryGroup: z.enum(['Income', 'Expense', 'Investment']),
    name: z.string().min(1, 'Category name is required'),
});
export const stockSchema = z.object({
    symbol: z.string().min(1, 'Symbol is required'),
    name: z.string().min(1, 'Name is required'),
    quantity: z.number().positive('Quantity must be greater than 0'),
    buyPrice: z.number().nonnegative('Buy price cannot be negative'),
    sellPrice: z.number().optional().nullable(),
    broker: z.string().optional().nullable(),
    type: z.enum(['BUY', 'SELL']),
    date: z.string().optional().nullable(),
});
