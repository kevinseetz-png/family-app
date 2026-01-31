import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/AuthProvider", () => ({
  useAuthContext: vi.fn().mockReturnValue({
    user: { id: "u1", name: "Test", familyId: "fam1", email: "t@t.com", role: "member" },
    logout: vi.fn(),
    visibleTabs: null,
    updateVisibleTabs: vi.fn(),
  }),
}));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: vi.fn().mockReturnValue({
    isSupported: true,
    isSubscribed: false,
    permission: "default",
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    preferences: { feedingReminders: true, vitaminReminders: true, familyActivity: true },
    updatePreferences: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import SettingsPage from "./page";

describe("Settings page (/instellingen)", () => {
  it("should render the settings page title", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: /instellingen/i })).toBeInTheDocument();
  });

  it("should show notification section", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: /meldingen/i })).toBeInTheDocument();
  });

  it("should show link to invite page", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("link", { name: /uitnodigen/i })).toHaveAttribute("href", "/invite");
  });

  it("should show logout button", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("button", { name: /uitloggen/i })).toBeInTheDocument();
  });
});
