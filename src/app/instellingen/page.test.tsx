import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockToggleTheme = vi.fn();
let mockTheme = "light";

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

vi.mock("@/hooks/useCustomCategories", () => ({
  useCustomCategories: vi.fn().mockReturnValue({
    categories: [],
    isLoading: false,
    addCategory: vi.fn(),
    deleteCategory: vi.fn(),
  }),
}));

vi.mock("@/components/CategoryManager", () => ({
  CategoryManager: () => <div data-testid="category-manager">CategoryManager</div>,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ theme: mockTheme, toggleTheme: mockToggleTheme }),
}));

import SettingsPage from "./page";

describe("Settings page (/instellingen)", () => {
  beforeEach(() => {
    mockTheme = "light";
    mockToggleTheme.mockClear();
  });

  it("should render the settings page title", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: /instellingen/i })).toBeInTheDocument();
  });

  it("should show notification section", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: /meldingen/i })).toBeInTheDocument();
  });

  it("should show Taken label in tab settings instead of Klusjes", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Taken")).toBeInTheDocument();
    expect(screen.queryByText("Klusjes")).not.toBeInTheDocument();
  });

  it("should show link to invite page", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("link", { name: /uitnodigen/i })).toHaveAttribute("href", "/invite");
  });

  it("should show logout button", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("button", { name: /uitloggen/i })).toBeInTheDocument();
  });

  it("should show dark mode section with heading", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: /weergave/i })).toBeInTheDocument();
  });

  it("should show dark mode toggle with label", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /dark mode/i })).toBeInTheDocument();
  });

  it("should show toggle as off when theme is light", () => {
    mockTheme = "light";
    render(<SettingsPage />);
    const toggle = screen.getByRole("switch", { name: /dark mode/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("should show toggle as on when theme is dark", () => {
    mockTheme = "dark";
    render(<SettingsPage />);
    const toggle = screen.getByRole("switch", { name: /dark mode/i });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("should call toggleTheme when dark mode toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    const toggle = screen.getByRole("switch", { name: /dark mode/i });
    await user.click(toggle);
    expect(mockToggleTheme).toHaveBeenCalledOnce();
  });
});
