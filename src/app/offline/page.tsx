export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">Je bent offline</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Controleer je internetverbinding en probeer opnieuw.
      </p>
    </main>
  );
}
