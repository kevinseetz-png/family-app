import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { RouteAnnouncer } from "@/components/RouteAnnouncer";

export const metadata: Metadata = {
  title: "Family App",
  description: "Our family hub",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-indigo-600"
        >
          Skip to content
        </a>
        <AuthProvider>
          <RouteAnnouncer />
          {children}
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
