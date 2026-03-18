"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/components/auth/AuthProvider";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const handleSignup = async (data: {
    email: string;
    password: string;
    name?: string;
  }) => {
    const result = await register({
      email: data.email,
      password: data.password,
      name: data.name || "",
    });

    if ("requiresVerification" in result) {
      router.push("/login?registered=true");
    } else {
      const redirectTo = searchParams.get("from") || "/profile";
      router.push(redirectTo);
      router.refresh();
    }
  };

  return <AuthForm type="signup" onSubmit={handleSignup} />;
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
