import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

let mockUser: { name: string; familyId: string } | null = {
  name: "Test User",
  familyId: "fam1",
};
let mockAuthLoading = false;
let mockIsLoading = false;
let mockError: string | null = null;
let mockRouterReplace = vi.fn();

vi.mock("@/components/AuthProvider", () => ({
  useAuthContext: () => ({
    user: mockUser,
    isLoading: mockAuthLoading,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
}));

vi.mock("@/hooks/useKlusjes", () => ({
  useKlusjes: () => ({
    items: [],
    isLoading: mockIsLoading,
    error: mockError,
    addItem: vi.fn(),
    toggleItem: vi.fn(),
    deleteItem: vi.fn(),
  }),
}));

vi.mock("@/components/LoadingSpinner", () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock("@/components/KlusjesForm", () => ({
  KlusjesForm: () => <div data-testid="klusjes-form">Form</div>,
}));

vi.mock("@/components/KlusjesList", () => ({
  KlusjesList: () => <div data-testid="klusjes-list">List</div>,
}));

import KlusjesPage from "./page";

/**
 * @vitest-environment jsdom
 */

describe("KlusjesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { name: "Test User", familyId: "fam1" };
    mockAuthLoading = false;
    mockIsLoading = false;
    mockError = null;
    mockRouterReplace = vi.fn();
  });

  it("should render the page title", () => {
    render(<KlusjesPage />);
    expect(screen.getByRole("heading", { name: "Klusjes" })).toBeInTheDocument();
  });

  it("should render the KlusjesForm component", () => {
    render(<KlusjesPage />);
    expect(screen.getByTestId("klusjes-form")).toBeInTheDocument();
  });

  it("should render the KlusjesList component", () => {
    render(<KlusjesPage />);
    expect(screen.getByTestId("klusjes-list")).toBeInTheDocument();
  });

  it("should show loading spinner when auth is loading", () => {
    mockAuthLoading = true;
    render(<KlusjesPage />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("should show loading spinner when klusjes are loading", () => {
    mockIsLoading = true;
    render(<KlusjesPage />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("should redirect to login when user is not authenticated", async () => {
    mockUser = null;
    render(<KlusjesPage />);

    await vi.waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("should return null when user is null after redirect", () => {
    mockUser = null;
    mockAuthLoading = false;
    const { container } = render(<KlusjesPage />);

    // After redirect logic runs, should return null
    expect(container.querySelector("main")).toBeNull();
  });

  it("should have correct heading styling", () => {
    render(<KlusjesPage />);
    const heading = screen.getByRole("heading", { name: "Klusjes" });
    expect(heading).toHaveClass("text-2xl", "font-bold", "text-emerald-600");
  });

  it("should have main content with correct id for accessibility", () => {
    render(<KlusjesPage />);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
  });

  it("should display error message when there is an error", () => {
    mockError = "Failed to load klusjes";
    render(<KlusjesPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Failed to load klusjes");
  });
});
