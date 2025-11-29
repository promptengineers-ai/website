import Link from "next/link";

export default function Offline() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-24">
      <h3 className="text-lg text-white">You are currently offline</h3>
      <Link
        href="/"
        className="rounded-full bg-white px-5 py-2 font-medium text-black transition-colors hover:bg-gray-200"
      >
        Go Home
      </Link>
    </main>
  );
}
