"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/components/auth/AuthProvider";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const { login } = useAuth();

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      await login({ email: data.email, password: data.password });
      const redirectTo = searchParams.get("from") || "/profile";
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  return (
    <div>
      {registered && (
        <div className="fixed left-1/2 top-4 z-50 mx-auto max-w-md -translate-x-1/2 transform rounded-md border border-green-700 bg-green-900/50 p-4">
          <p className="text-center text-green-200">
            Account created successfully! Please sign in.
          </p>
        </div>
      )}
      <AuthForm type="login" onSubmit={handleLogin} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
