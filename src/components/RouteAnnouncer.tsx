"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

export function RouteAnnouncer(): ReactElement {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const pageTitle = document.title || pathname;
    setAnnouncement(`Navigated to ${pageTitle}`);
  }, [pathname]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
