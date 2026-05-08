import { signIn } from "@/auth";
import { SignupForm } from "@/components/auth/signup-form";

async function signInWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/admin" });
}

export const metadata = {
  title: "Hesap oluştur — CommerceOS",
};

export default function SignupPage() {
  return <SignupForm signInWithGoogle={signInWithGoogle} />;
}
