import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { RouteAnnouncer } from "@/components/RouteAnnouncer";
import { InstallBanner } from "@/components/InstallBanner";
import { TabBar } from "@/components/TabBar";
import { MedicineReminder } from "@/components/MedicineReminder";

export const metadata: Metadata = {
  title: "Family App",
  description: "Our family hub",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased overflow-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white dark:bg-gray-800 focus:text-emerald-600"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <RouteAnnouncer />
            <TabBar />
            <div className="flex-1 overflow-y-auto">
              <MedicineReminder />
              {children}
              <InstallBanner />
            </div>
          </AuthProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
