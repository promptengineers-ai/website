"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import MemberStrip from "@/components/members/MemberStrip";

export default function HomeCommunityStrip({
  children,
}: {
  children: ReactNode;
}) {
  const { status } = useAuth();
  return status === "authenticated" ? <MemberStrip /> : <>{children}</>;
}
