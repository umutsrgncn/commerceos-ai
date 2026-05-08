import { signIn } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";

async function signInWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/admin" });
}

export const metadata = {
  title: "Giriş yap — CommerceOS",
};

export default function LoginPage() {
  return <LoginForm signInWithGoogle={signInWithGoogle} />;
}
