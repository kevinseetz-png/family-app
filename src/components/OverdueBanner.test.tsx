import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OverdueBanner } from "./OverdueBanner";

/**
 * @vitest-environment jsdom
 */

describe("OverdueBanner", () => {
  it("should not render when count is 0", () => {
    const { container } = render(<OverdueBanner count={0} onClick={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("should render banner with singular text for 1 overdue task", () => {
    render(<OverdueBanner count={1} onClick={vi.fn()} />);
    expect(screen.getByText(/1 verlopen taak/)).toBeInTheDocument();
  });

  it("should render banner with plural text for multiple overdue tasks", () => {
    render(<OverdueBanner count={3} onClick={vi.fn()} />);
    expect(screen.getByText(/3 verlopen taken/)).toBeInTheDocument();
  });

  it("should call onClick when banner is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<OverdueBanner count={2} onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("should have warning styling", () => {
    render(<OverdueBanner count={1} onClick={vi.fn()} />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-amber");
  });
});
