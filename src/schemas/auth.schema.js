import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El email es obligatorio")
    .email("Ingresa un email válido")
    .transform((value) =>
      value.toLowerCase()
    ),

  password: z
    .string()
    .min(1, "La contraseña es obligatoria"),
});

export const registerCustomerSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),

  last_name: z
    .string()
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(100),

  email: z
    .string()
    .trim()
    .email("Correo electrónico inválido")
    .transform((value) =>
      value.toLowerCase()
    ),

  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña es demasiado larga"),

  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable(),

  rut: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable(),
});

export const registerCompanySchema =
  registerCustomerSchema.extend({
    company: z.object({
      legal_name: z
        .string()
        .trim()
        .min(2, "La razón social es obligatoria")
        .max(255),

      trade_name: z
        .string()
        .trim()
        .max(255)
        .optional()
        .nullable(),

      rut: z
        .string()
        .trim()
        .min(3, "El RUT de empresa es obligatorio")
        .max(20),

      business_activity: z
        .string()
        .trim()
        .min(2, "El giro es obligatorio")
        .max(255),

      billing_email: z
        .string()
        .trim()
        .email("Correo de facturación inválido"),

      phone: z
        .string()
        .trim()
        .max(30)
        .optional()
        .nullable(),

      address_line: z
        .string()
        .trim()
        .min(2, "La dirección es obligatoria")
        .max(255),

      commune: z
        .string()
        .trim()
        .min(2, "La comuna es obligatoria")
        .max(120),

      city: z
        .string()
        .trim()
        .min(2, "La ciudad es obligatoria")
        .max(120),

      region: z
        .string()
        .trim()
        .min(2, "La región es obligatoria")
        .max(120),

      country: z
        .string()
        .trim()
        .min(2)
        .max(120)
        .default("Chile"),

      position_name: z
        .string()
        .trim()
        .max(120)
        .optional()
        .nullable(),
    }),
  });
