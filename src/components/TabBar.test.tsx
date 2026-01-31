import { render, screen } from "@testing-library/react";

let mockPathname = "/feeding";
let mockUser: { name: string } | null = { name: "Test" };

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuthContext: () => ({ user: mockUser }),
}));

import { TabBar } from "./TabBar";

describe("TabBar", () => {
  beforeEach(() => {
    mockPathname = "/feeding";
    mockUser = { name: "Test" };
  });

  it("renders 3 tabs", () => {
    render(<TabBar />);
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Noties")).toBeInTheDocument();
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("marks the active tab based on pathname", () => {
    mockPathname = "/notes";
    render(<TabBar />);
    expect(screen.getByText("Noties")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Food")).not.toHaveAttribute("aria-current");
  });

  it("links to correct routes", () => {
    render(<TabBar />);
    expect(screen.getByText("Food").closest("a")).toHaveAttribute("href", "/feeding");
    expect(screen.getByText("Noties").closest("a")).toHaveAttribute("href", "/notes");
    expect(screen.getByText("Menu").closest("a")).toHaveAttribute("href", "/weekmenu");
  });

  it("renders nothing when user is not logged in", () => {
    mockUser = null;
    const { container } = render(<TabBar />);
    expect(container.innerHTML).toBe("");
  });
});
