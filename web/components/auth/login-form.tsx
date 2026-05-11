"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Sparkles } from "lucide-react";

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

const DEMO_EMAIL = "demo@commerceos.dev";
const DEMO_PASSWORD = "demo1234";
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? "Giriş yapılıyor..." : "Giriş yap"}
    </Button>
  );
}

export function LoginForm() {
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
        {/* Hackathon demo banner */}
        <div className="flex items-start gap-2 rounded-lg border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 to-indigo-500/5 p-3">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fuchsia-500" />
          <div className="space-y-0.5">
            <p className="text-xs font-medium">
              Hackathon demo · hazır hesap
            </p>
            <p className="text-[11px] text-[color:var(--color-muted)]">
              Demo bilgileri formda dolu — direkt{" "}
              <strong>Giriş yap</strong>&apos;a basabilirsin.
            </p>
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
              defaultValue={DEMO_EMAIL}
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
              defaultValue={DEMO_PASSWORD}
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
