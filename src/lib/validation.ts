// Reusable validation primitives for shipment booking — shared between the
// client-side booking form (blocks "Continue" until valid) and the server
// API schema (never trusts the client to have enforced this). One source
// of truth for what counts as a valid phone/pincode/address/dimension.
import { z } from "zod";

// Indian mobile numbers: optional +91/91/0 prefix, then a 10-digit number
// starting 6-9. Accepts common formatting (spaces) by stripping first.
const INDIA_PHONE_RE = /^[6-9]\d{9}$/;
export function isValidIndianPhone(raw: string): boolean {
  const digits = raw.replace(/[\s\-()]/g, "").replace(/^(\+?91|0)/, "");
  return INDIA_PHONE_RE.test(digits);
}

// Indian PIN codes: 6 digits, first digit 1-9 (never 0).
const INDIA_PINCODE_RE = /^[1-9]\d{5}$/;
export function isValidIndianPincode(raw: string): boolean {
  return INDIA_PINCODE_RE.test(raw.trim());
}

export const MAX_WEIGHT_KG = 100;
export const MAX_DIMENSION_CM = 300;

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine(isValidIndianPhone, "Enter a valid 10-digit Indian mobile number");

export const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters");

export const addressLineSchema = z
  .string()
  .trim()
  .min(5, "Address must be at least 5 characters")
  .refine((v) => v.replace(/\s/g, "").length > 0, "Address cannot be blank");

export const citySchema = z.string().trim().min(2, "City is required");
export const stateSchema = z.string().trim().min(2, "State is required");

export const pincodeSchema = z
  .string()
  .trim()
  .min(1, "PIN code is required")
  .refine(isValidIndianPincode, "Enter a valid 6-digit Indian PIN code");

export const weightSchema = z
  .number()
  .positive("Weight must be greater than 0")
  .max(MAX_WEIGHT_KG, `Weight cannot exceed ${MAX_WEIGHT_KG} kg`);

export const dimensionSchema = z
  .number()
  .positive("Must be greater than 0")
  .max(MAX_DIMENSION_CM, `Cannot exceed ${MAX_DIMENSION_CM} cm`);

export const partySchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  addressLine: addressLineSchema,
  city: citySchema,
  state: stateSchema,
  pincode: pincodeSchema,
});

export const packageSchema = z.object({
  packageType: z.enum(["standard", "fragile", "medical", "express"]),
  weightKg: weightSchema,
  lengthCm: dimensionSchema,
  widthCm: dimensionSchema,
  heightCm: dimensionSchema,
});

export type Party = z.infer<typeof partySchema>;
export type PackageDetails = z.infer<typeof packageSchema>;

// Runs a zod object schema and returns a flat field->message error map,
// convenient for driving inline form errors without re-deriving zod's
// nested issue format in every component.
export function validateToFieldErrors<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: unknown,
): Record<string, string> {
  const result = schema.safeParse(data);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
