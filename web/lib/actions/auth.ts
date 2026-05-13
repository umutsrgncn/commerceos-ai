"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { signIn } from "@/auth";
import { db } from "@/lib/db";

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

const signUpSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalı").max(80),
  email: z.string().email("Geçerli bir e-posta gir"),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .max(128, "Şifre çok uzun"),
});

const signInSchema = z.object({
  email: z.string().email("Geçerli bir e-posta gir"),
  password: z.string().min(1, "Şifre boş olamaz"),
});

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "Bu e-posta zaten kayıtlı." };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      hashedPassword,
      // Hackathon demo: ilk-kayıt admin paneline anında erişebilsin.
      // Production'da ilk kullanıcı ADMIN, sonrakiler VIEWER + admin onayı pattern'i tercih edilir.
      role: "ADMIN",
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/admin",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Kayıt sonrası giriş yapılamadı." };
    }
    throw err;
  }
  return null;
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/admin",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return { error: "E-posta veya şifre hatalı." };
        default:
          return { error: "Giriş yapılamadı." };
      }
    }
    throw err;
  }
  return null;
}
