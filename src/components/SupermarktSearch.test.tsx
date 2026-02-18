import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SupermarktSearch } from "./SupermarktSearch";

describe("SupermarktSearch", () => {
  it("should render search input", () => {
    render(<SupermarktSearch query="" onQueryChange={vi.fn()} />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("should display placeholder text", () => {
    render(<SupermarktSearch query="" onQueryChange={vi.fn()} />);
    expect(screen.getByPlaceholderText(/zoek een product/i)).toBeInTheDocument();
  });

  it("should call onQueryChange when typing", async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(<SupermarktSearch query="" onQueryChange={onQueryChange} />);

    const input = screen.getByRole("searchbox");
    await user.type(input, "melk");
    expect(onQueryChange).toHaveBeenCalled();
  });

  it("should display current query value", () => {
    render(<SupermarktSearch query="melk" onQueryChange={vi.fn()} />);
    expect(screen.getByRole("searchbox")).toHaveValue("melk");
  });

  it("should have accessible label", () => {
    render(<SupermarktSearch query="" onQueryChange={vi.fn()} />);
    expect(screen.getByLabelText(/zoek/i)).toBeInTheDocument();
  });
});
