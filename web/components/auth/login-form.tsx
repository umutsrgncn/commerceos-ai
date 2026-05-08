"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signInAction, type AuthActionState } from "@/lib/actions/auth";
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
import { GoogleButton } from "./google-button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? "Giriş yapılıyor..." : "Giriş yap"}
    </Button>
  );
}

export function LoginForm({
  signInWithGoogle,
}: {
  signInWithGoogle: () => Promise<void>;
}) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    signInAction,
    null
  );

  return (
    <Card className="border-[color:var(--color-border)]/80 bg-[color:var(--color-bg)]/70 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Tekrar hoş geldin</CardTitle>
        <CardDescription>
          Yönetici hesabınla giriş yap, dashboard&apos;a dönelim.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form action={signInWithGoogle}>
          <GoogleButton />
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[color:var(--color-border)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[color:var(--color-bg)] px-2 text-[color:var(--color-muted)]">
              veya e-posta ile
            </span>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Şifre</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
              >
                Unuttum
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            {state?.fieldErrors?.password && (
              <p className="text-xs text-red-500">
                {state.fieldErrors.password[0]}
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
        Hesabın yok mu?{" "}
        <Link
          href="/signup"
          className="ml-1 font-medium text-[color:var(--color-fg)] hover:underline"
        >
          Kayıt ol
        </Link>
      </CardFooter>
    </Card>
  );
}
