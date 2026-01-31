import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommunityForm } from "./CommunityForm";

/**
 * @vitest-environment jsdom
 */

describe("CommunityForm", () => {
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render textarea and submit button", () => {
    render(<CommunityForm onAdd={mockOnAdd} />);

    expect(screen.getByPlaceholderText("Schrijf een bericht...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Plaatsen" })).toBeInTheDocument();
  });

  it("should update textarea value when typing", async () => {
    const user = userEvent.setup();
    render(<CommunityForm onAdd={mockOnAdd} />);

    const textarea = screen.getByPlaceholderText("Schrijf een bericht...");
    await user.type(textarea, "Hello community");

    expect(textarea).toHaveValue("Hello community");
  });

  it("should call onAdd with content when form is submitted", async () => {
    const user = userEvent.setup();
    mockOnAdd.mockResolvedValue(undefined);

    render(<CommunityForm onAdd={mockOnAdd} />);

    const textarea = screen.getByPlaceholderText("Schrijf een bericht...");
    const submitButton = screen.getByRole("button", { name: "Plaatsen" });

    await user.type(textarea, "My first post");
    await user.click(submitButton);

    expect(mockOnAdd).toHaveBeenCalledWith("My first post");
  });

  it("should clear textarea after successful submission", async () => {
    const user = userEvent.setup();
    mockOnAdd.mockResolvedValue(undefined);

    render(<CommunityForm onAdd={mockOnAdd} />);

    const textarea = screen.getByPlaceholderText("Schrijf een bericht...");
    await user.type(textarea, "Test post");
    await user.click(screen.getByRole("button", { name: "Plaatsen" }));

    await vi.waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("should disable submit button while submitting", async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void;
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });
    mockOnAdd.mockReturnValue(submitPromise);

    render(<CommunityForm onAdd={mockOnAdd} />);

    const textarea = screen.getByPlaceholderText("Schrijf een bericht...");
    const submitButton = screen.getByRole("button", { name: "Plaatsen" });

    await user.type(textarea, "Test");
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
    mockOnAdd.mockRejectedValue(new Error("Failed to post"));

    render(<CommunityForm onAdd={mockOnAdd} />);

    const textarea = screen.getByPlaceholderText("Schrijf een bericht...");
    await user.type(textarea, "Test post");
    await user.click(screen.getByRole("button", { name: "Plaatsen" }));

    await vi.waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Failed to post");
    });
  });

  it("should show generic error message when error is not an Error instance", async () => {
    const user = userEvent.setup();
    mockOnAdd.mockRejectedValue("Unknown error");

    render(<CommunityForm onAdd={mockOnAdd} />);

    const textarea = screen.getByPlaceholderText("Schrijf een bericht...");
    await user.type(textarea, "Test post");
    await user.click(screen.getByRole("button", { name: "Plaatsen" }));

    await vi.waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Kon bericht niet plaatsen");
    });
  });

  it("should not submit when textarea is empty", async () => {
    const user = userEvent.setup();
    render(<CommunityForm onAdd={mockOnAdd} />);

    const submitButton = screen.getByRole("button", { name: "Plaatsen" });
    await user.click(submitButton);

    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it("should trim whitespace from content before submission", async () => {
    const user = userEvent.setup();
    mockOnAdd.mockResolvedValue(undefined);

    render(<CommunityForm onAdd={mockOnAdd} />);

    const textarea = screen.getByPlaceholderText("Schrijf een bericht...");
    await user.type(textarea, "  Test post  ");
    await user.click(screen.getByRole("button", { name: "Plaatsen" }));

    expect(mockOnAdd).toHaveBeenCalledWith("Test post");
  });

  it("should not submit when content is only whitespace", async () => {
    const user = userEvent.setup();
    render(<CommunityForm onAdd={mockOnAdd} />);

    const textarea = screen.getByPlaceholderText("Schrijf een bericht...");
    await user.type(textarea, "   ");
    await user.click(screen.getByRole("button", { name: "Plaatsen" }));

    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it("should have accessible label for textarea", () => {
    render(<CommunityForm onAdd={mockOnAdd} />);

    const textarea = screen.getByPlaceholderText("Schrijf een bericht...");
    expect(textarea).toHaveAccessibleName();
  });
});
