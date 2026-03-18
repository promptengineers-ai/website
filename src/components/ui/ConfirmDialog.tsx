"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  variant = "default",
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-xl">
          <DialogTitle className="text-lg font-bold text-white">
            {title}
          </DialogTitle>
          <p className="mt-2 text-sm text-gray-300">{message}</p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                variant === "danger"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Confirm
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
