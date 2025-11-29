import { useState, useRef } from "react";
import Image from "next/image";

type AvatarUploadProps = {
  avatarUrl?: string;
  onFileSelect: (file: File | null) => void;
  onDelete?: () => void; // Optional if we want to support deleting explicitly, though replacing is common
};

export default function AvatarUpload({
  avatarUrl,
  onFileSelect,
  onDelete,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      onFileSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onDelete) onDelete();
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="block text-sm font-medium text-gray-200">
        Profile Picture
      </label>
      <div className="flex items-center gap-6">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border border-gray-700 bg-gray-800">
          {preview ? (
            <Image
              src={preview}
              alt="Avatar preview"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-500">
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            {preview ? "Change Photo" : "Upload Photo"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          )}
          <p className="text-xs text-gray-500">
            JPG, PNG or WebP. Max 5MB.
          </p>
        </div>
      </div>
    </div>
  );
}

