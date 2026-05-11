"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signUpAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? "Hesap oluşturuluyor..." : "Hesap oluştur"}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    signUpAction,
    null
  );

  return (
    <Card className="border-[color:var(--color-border)]/80 bg-[color:var(--color-bg)]/70 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Yeni hesap oluştur</CardTitle>
        <CardDescription>
          CommerceOS&apos;u takıma getir, yönetici olarak başla.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              placeholder="Çiğdem Kılıç"
            />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-red-500">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="ornek@firma.com"
            />
            {state?.fieldErrors?.email && (
              <p className="text-xs text-red-500">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            {state?.fieldErrors?.password ? (
              <p className="text-xs text-red-500">
                {state.fieldErrors.password[0]}
              </p>
            ) : (
              <p className="text-xs text-[color:var(--color-muted)]">
                En az 8 karakter
              </p>
            )}
          </div>

          {state?.error && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </CardContent>

      <CardFooter className="flex justify-center text-sm text-[color:var(--color-muted)]">
        Zaten hesabın var mı?{" "}
        <Link
          href="/login"
          className="ml-1 font-medium text-[color:var(--color-fg)] hover:underline"
        >
          Giriş yap
        </Link>
      </CardFooter>
    </Card>
  );
}
