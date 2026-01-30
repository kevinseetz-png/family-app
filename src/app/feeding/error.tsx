"use client";

export default function FeedingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Er ging iets mis</h1>
      <p className="text-sm text-gray-700 mb-2">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700"
      >
        Opnieuw proberen
      </button>
    </main>
  );
}
