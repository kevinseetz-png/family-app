import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddTaskModal } from "./AddTaskModal";

/**
 * @vitest-environment jsdom
 */

describe("AddTaskModal", () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the modal with title", () => {
    render(<AddTaskModal selectedDate="2026-02-15" onSave={mockOnSave} onClose={mockOnClose} />);
    expect(screen.getByText("Nieuwe taak")).toBeInTheDocument();
  });

  it("should pre-fill the date from selectedDate", () => {
    render(<AddTaskModal selectedDate="2026-02-15" onSave={mockOnSave} onClose={mockOnClose} />);
    const dateInput = screen.getByLabelText("Datum");
    expect(dateInput).toHaveValue("2026-02-15");
  });

  it("should have a name input", () => {
    render(<AddTaskModal selectedDate="2026-02-15" onSave={mockOnSave} onClose={mockOnClose} />);
    expect(screen.getByPlaceholderText("Taaknaam")).toBeInTheDocument();
  });

  it("should call onSave with task data on submit", async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValue(undefined);
    render(<AddTaskModal selectedDate="2026-02-15" onSave={mockOnSave} onClose={mockOnClose} />);

    await user.type(screen.getByPlaceholderText("Taaknaam"), "Stofzuigen");
    await user.click(screen.getByRole("button", { name: /bewaar/i }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Stofzuigen",
        date: "2026-02-15",
        priority: 2,
        recurrence: "none",
      })
    );
  });

  it("should not submit with empty name", async () => {
    const user = userEvent.setup();
    render(<AddTaskModal selectedDate="2026-02-15" onSave={mockOnSave} onClose={mockOnClose} />);

    await user.click(screen.getByRole("button", { name: /bewaar/i }));
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should call onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<AddTaskModal selectedDate="2026-02-15" onSave={mockOnSave} onClose={mockOnClose} />);

    await user.click(screen.getByRole("button", { name: /annuleren/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should show priority buttons", () => {
    render(<AddTaskModal selectedDate="2026-02-15" onSave={mockOnSave} onClose={mockOnClose} />);
    expect(screen.getByRole("button", { name: /hoog/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /normaal/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /laag/i })).toBeInTheDocument();
  });

  it("should submit with high priority when selected", async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValue(undefined);
    render(<AddTaskModal selectedDate="2026-02-15" onSave={mockOnSave} onClose={mockOnClose} />);

    await user.type(screen.getByPlaceholderText("Taaknaam"), "Urgent");
    await user.click(screen.getByRole("button", { name: /hoog/i }));
    await user.click(screen.getByRole("button", { name: /bewaar/i }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 1 })
    );
  });

  it("should show reminder select defaulting to 'Geen'", () => {
    render(<AddTaskModal selectedDate="2026-02-15" onSave={mockOnSave} onClose={mockOnClose} />);
    expect(screen.getByLabelText(/herinnering/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/herinnering/i)).toHaveValue("");
  });

  it("should submit with reminder when selected", async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValue(undefined);
    render(<AddTaskModal selectedDate="2026-02-15" onSave={mockOnSave} onClose={mockOnClose} />);

    await user.type(screen.getByPlaceholderText("Taaknaam"), "Alarm test");
    await user.selectOptions(screen.getByLabelText(/herinnering/i), "15");
    await user.click(screen.getByRole("button", { name: /bewaar/i }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ reminder: "15" })
    );
  });

  it("should submit with null reminder when 'Geen' is selected", async () => {
    const user = userEvent.setup();
    mockOnSave.mockResolvedValue(undefined);
    render(<AddTaskModal selectedDate="2026-02-15" onSave={mockOnSave} onClose={mockOnClose} />);

    await user.type(screen.getByPlaceholderText("Taaknaam"), "No alarm");
    await user.click(screen.getByRole("button", { name: /bewaar/i }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ reminder: null })
    );
  });

  it("should show error message when save fails", async () => {
    const user = userEvent.setup();
    mockOnSave.mockRejectedValue(new Error("Kon taak niet toevoegen"));
    render(<AddTaskModal selectedDate="2026-02-15" onSave={mockOnSave} onClose={mockOnClose} />);

    await user.type(screen.getByPlaceholderText("Taaknaam"), "Test");
    await user.click(screen.getByRole("button", { name: /bewaar/i }));

    await vi.waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Kon taak niet toevoegen");
    });
  });
});
