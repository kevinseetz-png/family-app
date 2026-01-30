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
    .min(8, "Password must be at least 8 characters")
    .max(128),
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
  id: z.string().min(1, "Feeding ID is required"),
  foodType: z.enum(["breast_milk", "formula", "puree", "solid", "snack"], {
    message: "Food type is required",
  }),
  amount: z.number().positive("Amount must be positive"),
  unit: z.enum(["ml", "g"], { message: "Unit is required" }),
  timestamp: z.string().datetime("Invalid timestamp"),
});
