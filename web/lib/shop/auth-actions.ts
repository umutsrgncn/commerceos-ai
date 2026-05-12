"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  customerLoginSchema,
  customerRegisterSchema,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  type AuthActionState,
} from "./auth";

function safeNext(next: string | null | undefined): string {
  if (!next) return "/shop/account";
  // Sadece kendi domain'imize redirect
  if (next.startsWith("/shop") || next.startsWith("/")) return next;
  return "/shop/account";
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = customerLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const result = await loginCustomer(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return { error: result.error };
  }
  revalidatePath("/shop");
  redirect(safeNext(formData.get("next")?.toString()));
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = customerRegisterSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    phone: formData.get("phone") || null,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const result = await registerCustomer(
    parsed.data.email,
    parsed.data.name,
    parsed.data.password,
    parsed.data.phone ?? null,
  );
  if (!result.ok) {
    return { error: result.error };
  }
  revalidatePath("/shop");
  redirect(safeNext(formData.get("next")?.toString()));
}

export async function logoutAction(): Promise<void> {
  await logoutCustomer();
  revalidatePath("/shop");
  redirect("/shop");
}
