import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter").max(120),
  email: z.string().email("Geçerli bir e-posta gir"),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
    newPassword: z.string().min(8, "Yeni şifre en az 8 karakter").max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Şifreler eşleşmiyor",
  });
