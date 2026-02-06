import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KlusjesForm } from "./KlusjesForm";

/**
 * @vitest-environment jsdom
 */

describe("KlusjesForm", () => {
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render input and submit button", () => {
    render(<KlusjesForm onAdd={mockOnAdd} />);

    expect(screen.getByPlaceholderText("Voeg klusje toe...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Toevoegen" })).toBeInTheDocument();
  });

  it("should update input value when typing", async () => {
    const user = userEvent.setup();
    render(<KlusjesForm onAdd={mockOnAdd} />);

    const input = screen.getByPlaceholderText("Voeg klusje toe...");
    await user.type(input, "Stofzuigen");

    expect(input).toHaveValue("Stofzuigen");
  });

  it("should call onAdd with name when form is submitted", async () => {
    const user = userEvent.setup();
    mockOnAdd.mockResolvedValue(undefined);

    render(<KlusjesForm onAdd={mockOnAdd} />);

    const input = screen.getByPlaceholderText("Voeg klusje toe...");
    const submitButton = screen.getByRole("button", { name: "Toevoegen" });

    await user.type(input, "Afwassen");
    await user.click(submitButton);

    expect(mockOnAdd).toHaveBeenCalledWith("Afwassen");
  });

  it("should clear input after successful submission", async () => {
    const user = userEvent.setup();
    mockOnAdd.mockResolvedValue(undefined);

    render(<KlusjesForm onAdd={mockOnAdd} />);

    const input = screen.getByPlaceholderText("Voeg klusje toe...");
    await user.type(input, "Test klusje");
    await user.click(screen.getByRole("button", { name: "Toevoegen" }));

    await vi.waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("should disable submit button while submitting", async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void;
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });
    mockOnAdd.mockReturnValue(submitPromise);

    render(<KlusjesForm onAdd={mockOnAdd} />);

    const input = screen.getByPlaceholderText("Voeg klusje toe...");
    const submitButton = screen.getByRole("button", { name: "Toevoegen" });

    await user.type(input, "Test");
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText("...")).toBeInTheDocument();

    resolveSubmit!();
    await vi.waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("should show error message when submission fails", async () => {
    const user = userEvent.setup();
    mockOnAdd.mockRejectedValue(new Error("Kon klusje niet toevoegen"));

    render(<KlusjesForm onAdd={mockOnAdd} />);

    const input = screen.getByPlaceholderText("Voeg klusje toe...");
    await user.type(input, "Test");
    await user.click(screen.getByRole("button", { name: "Toevoegen" }));

    await vi.waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Kon klusje niet toevoegen");
    });
  });

  it("should show generic error message when error is not an Error instance", async () => {
    const user = userEvent.setup();
    mockOnAdd.mockRejectedValue("Unknown error");

    render(<KlusjesForm onAdd={mockOnAdd} />);

    const input = screen.getByPlaceholderText("Voeg klusje toe...");
    await user.type(input, "Test");
    await user.click(screen.getByRole("button", { name: "Toevoegen" }));

    await vi.waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Kon klusje niet toevoegen");
    });
  });

  it("should not submit when input is empty", async () => {
    const user = userEvent.setup();
    render(<KlusjesForm onAdd={mockOnAdd} />);

    const submitButton = screen.getByRole("button", { name: "Toevoegen" });
    await user.click(submitButton);

    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it("should trim whitespace from name before submission", async () => {
    const user = userEvent.setup();
    mockOnAdd.mockResolvedValue(undefined);

    render(<KlusjesForm onAdd={mockOnAdd} />);

    const input = screen.getByPlaceholderText("Voeg klusje toe...");
    await user.type(input, "  Stofzuigen  ");
    await user.click(screen.getByRole("button", { name: "Toevoegen" }));

    expect(mockOnAdd).toHaveBeenCalledWith("Stofzuigen");
  });

  it("should not submit when input is only whitespace", async () => {
    const user = userEvent.setup();
    render(<KlusjesForm onAdd={mockOnAdd} />);

    const input = screen.getByPlaceholderText("Voeg klusje toe...");
    await user.type(input, "   ");
    await user.click(screen.getByRole("button", { name: "Toevoegen" }));

    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it("should have accessible label for input", () => {
    render(<KlusjesForm onAdd={mockOnAdd} />);

    const input = screen.getByPlaceholderText("Voeg klusje toe...");
    expect(input).toHaveAccessibleName();
  });
});
