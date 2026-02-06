import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128)
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a digit"),
  inviteCode: z.string().min(1, "Invite code is required"),
});

export const firstUserRegisterSchema = registerSchema.omit({ inviteCode: true });

export const feedingSchema = z.object({
  foodType: z.enum(["breast_milk", "formula", "puree", "solid", "snack"], {
    message: "Food type is required",
  }),
  amount: z.number().positive("Amount must be positive"),
  unit: z.enum(["ml", "g"], { message: "Unit is required" }),
  timestamp: z.string().datetime().optional(),
});

export const feedingUpdateSchema = z.object({
  id: z.string().min(1, "Invalid request"),
  foodType: z.enum(["breast_milk", "formula", "puree", "solid", "snack"], {
    message: "Food type is required",
  }),
  amount: z.number().positive("Amount must be positive"),
  unit: z.enum(["ml", "g"], { message: "Unit is required" }),
  timestamp: z.string().datetime("Invalid timestamp"),
});

export const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  content: z.string().min(1, "Content is required").max(5000, "Content is too long"),
});

export const noteUpdateSchema = z.object({
  id: z.string().min(1, "Invalid request"),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  content: z.string().min(1, "Content is required").max(5000, "Content is too long"),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("Invalid endpoint URL"),
  keys: z.object({
    auth: z.string().min(1, "Auth key is required"),
    p256dh: z.string().min(1, "P256dh key is required"),
  }),
});

const dayField = z.string().max(500, "Max 500 characters per day");

export const vitaminToggleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export const grocerySchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
});

export const groceryUpdateSchema = z.object({
  id: z.string().min(1, "Invalid request"),
  checked: z.boolean(),
});

export const groceryDeleteSchema = z.object({
  id: z.string().min(1, "Invalid request"),
});

export const weekMenuSchema = z.object({
  days: z.object({
    mon: dayField,
    tue: dayField,
    wed: dayField,
    thu: dayField,
    fri: dayField,
    sat: dayField,
    sun: dayField,
  }),
});

export const moveUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  targetFamilyId: z.string().min(1, "Target family ID is required"),
});

export const deleteUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const communityPostSchema = z.object({
  content: z.string().min(1, "Bericht is verplicht").max(2000, "Bericht is te lang"),
});

export const tabPreferencesSchema = z.object({
  visibleTabs: z.array(z.string().min(1)).min(1, "Selecteer ten minste één tab"),
});

// Medicine schemas
export const medicineSchema = z.object({
  name: z.string().min(1, "Naam is verplicht").max(200, "Naam is te lang"),
  reminderHour: z.number().int().min(0).max(23),
  reminderMinute: z.number().int().min(0).max(59),
});

export const medicineUpdateSchema = z.object({
  id: z.string().min(1, "Invalid request"),
  name: z.string().min(1, "Naam is verplicht").max(200, "Naam is te lang").optional(),
  reminderHour: z.number().int().min(0).max(23).optional(),
  reminderMinute: z.number().int().min(0).max(59).optional(),
  active: z.boolean().optional(),
});

export const medicineDeleteSchema = z.object({
  id: z.string().min(1, "Invalid request"),
});

export const medicineCheckSchema = z.object({
  medicineId: z.string().min(1, "Medicine ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

// Meal schemas
export const mealSchema = z.object({
  name: z.string().min(1, "Naam is verplicht").max(200, "Naam is te lang"),
  ingredients: z.string().max(2000, "Ingrediënten zijn te lang").optional().default(""),
  instructions: z.string().max(5000, "Instructies zijn te lang").optional().default(""),
  sourceDay: z.string().optional(),
});

export const mealUpdateSchema = z.object({
  id: z.string().min(1, "Invalid request"),
  name: z.string().min(1, "Naam is verplicht").max(200, "Naam is te lang").optional(),
  ingredients: z.string().max(2000, "Ingrediënten zijn te lang").optional(),
  instructions: z.string().max(5000, "Instructies zijn te lang").optional(),
});

export const mealDeleteSchema = z.object({
  id: z.string().min(1, "Invalid request"),
});

// Klusjes schemas
export const klusjesSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
});

export const klusjesUpdateSchema = z.object({
  id: z.string().min(1, "Invalid request"),
  checked: z.boolean(),
});

export const klusjesDeleteSchema = z.object({
  id: z.string().min(1, "Invalid request"),
});
