"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface Props {
  email: string;
}

export default function DeleteAccountCard({ email }: Props) {
  const { toast } = useToast();
  const [typedEmail, setTypedEmail] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const emailMatches =
    typedEmail.trim().toLowerCase() === email.trim().toLowerCase();

  const handleDelete = async () => {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      const response = await fetch("/api/users", { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete account");
      }
      window.location.assign("/");
    } catch (err) {
      setDeleting(false);
      toast(
        err instanceof Error ? err.message : "Failed to delete account",
        "error",
      );
    }
  };

  return (
    <div className="rounded-lg border border-red-900/60 bg-gray-900 p-6 shadow-lg">
      <h2 className="mb-2 text-xl font-semibold text-red-400">
        Delete Account
      </h2>
      <p className="mb-4 text-sm text-gray-400">
        Permanently removes your account, profile, avatar, resume, and
        hackathon registrations. Any hackathon team seat you hold is released.
        This cannot be undone.
      </p>
      <label
        htmlFor="delete-account-email"
        className="mb-2 block text-sm font-medium text-gray-300"
      >
        Type <span className="font-mono text-gray-200">{email}</span> to
        confirm
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="delete-account-email"
          type="email"
          autoComplete="off"
          value={typedEmail}
          onChange={(e) => setTypedEmail(e.target.value)}
          disabled={deleting}
          className="min-w-0 flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          placeholder={email}
        />
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!emailMatches || deleting}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete my account"}
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete your account?"
        message="Your account and all associated data will be permanently erased. You will be signed out immediately."
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
