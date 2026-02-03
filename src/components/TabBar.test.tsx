import { render, screen } from "@testing-library/react";

let mockPathname = "/feeding";
let mockUser: { name: string } | null = { name: "Test" };

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuthContext: () => ({ user: mockUser, visibleTabs: null }),
}));

import { TabBar } from "./TabBar";

describe("TabBar", () => {
  beforeEach(() => {
    mockPathname = "/feeding";
    mockUser = { name: "Test" };
  });

  it("renders all tabs including settings", () => {
    render(<TabBar />);
    expect(screen.getByText("Eten")).toBeInTheDocument();
    expect(screen.getByText("Noties")).toBeInTheDocument();
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByText("Boodschap")).toBeInTheDocument();
    expect(screen.getByText("Medicijn")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("⚙️")).toBeInTheDocument();
  });

  it("marks the active tab based on pathname", () => {
    mockPathname = "/notes";
    render(<TabBar />);
    expect(screen.getByText("Noties")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Eten")).not.toHaveAttribute("aria-current");
  });

  it("links to correct routes", () => {
    render(<TabBar />);
    expect(screen.getByText("Eten").closest("a")).toHaveAttribute("href", "/feeding");
    expect(screen.getByText("Noties").closest("a")).toHaveAttribute("href", "/notes");
    expect(screen.getByText("Menu").closest("a")).toHaveAttribute("href", "/weekmenu");
    expect(screen.getByText("⚙️").closest("a")).toHaveAttribute("href", "/instellingen");
  });

  it("renders nothing when user is not logged in", () => {
    mockUser = null;
    const { container } = render(<TabBar />);
    expect(container.innerHTML).toBe("");
  });
});
