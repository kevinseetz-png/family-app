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

  it("renders all tabs including settings and klusjes", () => {
    render(<TabBar />);
    expect(screen.getByText("Eten")).toBeInTheDocument();
    expect(screen.getByText("Noties")).toBeInTheDocument();
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByText("Boodschap")).toBeInTheDocument();
    expect(screen.getByText("Klusjes")).toBeInTheDocument();
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
    expect(screen.getByText("Klusjes").closest("a")).toHaveAttribute("href", "/klusjes");
    expect(screen.getByText("⚙️").closest("a")).toHaveAttribute("href", "/instellingen");
  });

  it("renders nothing when user is not logged in", () => {
    mockUser = null;
    const { container } = render(<TabBar />);
    expect(container.innerHTML).toBe("");
  });

  it("marks klusjes tab as active when on klusjes page", () => {
    mockPathname = "/klusjes";
    render(<TabBar />);
    expect(screen.getByText("Klusjes")).toHaveAttribute("aria-current", "page");
  });

  it("has horizontal scroll container for tabs", () => {
    render(<TabBar />);
    const nav = screen.getByRole("navigation");
    const scrollContainer = nav.querySelector("ul");
    expect(scrollContainer).toHaveClass("overflow-x-auto");
  });

  it("hides scrollbar on the tab container", () => {
    render(<TabBar />);
    const nav = screen.getByRole("navigation");
    const scrollContainer = nav.querySelector("ul");
    expect(scrollContainer).toHaveClass("scrollbar-hide");
  });

  it("tabs do not shrink when container overflows", () => {
    render(<TabBar />);
    const tabs = screen.getAllByRole("listitem");
    tabs.forEach((tab) => {
      expect(tab).toHaveClass("flex-shrink-0");
    });
  });
});
