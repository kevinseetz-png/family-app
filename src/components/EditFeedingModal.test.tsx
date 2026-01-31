import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditFeedingModal } from "./EditFeedingModal";
import type { Feeding } from "@/types/feeding";

const mockFeeding: Feeding = {
  id: "f1",
  familyId: "fam1",
  foodType: "breast_milk",
  amount: 120,
  unit: "ml",
  loggedBy: "u1",
  loggedByName: "Test User",
  timestamp: new Date("2025-01-15T10:00:00Z"),
  createdAt: new Date("2025-01-15T10:00:00Z"),
};

describe("EditFeedingModal", () => {
  let onSave: ReturnType<typeof vi.fn>;
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSave = vi.fn().mockResolvedValue(undefined);
    onClose = vi.fn();
  });

  it("should render with the feeding data pre-filled", () => {
    render(<EditFeedingModal feeding={mockFeeding} onSave={onSave} onClose={onClose} />);
    expect(screen.getByLabelText(/food type/i)).toHaveValue("breast_milk");
    expect(screen.getByLabelText(/amount/i)).toHaveValue(120);
    expect(screen.getByLabelText(/unit/i)).toHaveValue("ml");
  });

  it("should have compact mobile-friendly padding (p-4)", () => {
    render(<EditFeedingModal feeding={mockFeeding} onSave={onSave} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("p-4");
    expect(dialog.className).not.toContain("p-6");
  });

  it("should call onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<EditFeedingModal feeding={mockFeeding} onSave={onSave} onClose={onClose} />);
    await user.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("should call onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(<EditFeedingModal feeding={mockFeeding} onSave={onSave} onClose={onClose} />);
    // The backdrop is the outer fixed div
    const backdrop = screen.getByRole("dialog").parentElement!;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("should call onSave with updated data on submit", async () => {
    const user = userEvent.setup();
    render(<EditFeedingModal feeding={mockFeeding} onSave={onSave} onClose={onClose} />);

    const amountInput = screen.getByLabelText(/amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, "200");

    await user.click(screen.getByText("Save"));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "f1",
        amount: 200,
      })
    );
  });

  it("should show error when onSave rejects", async () => {
    onSave.mockRejectedValue(new Error("Save failed"));
    const user = userEvent.setup();
    render(<EditFeedingModal feeding={mockFeeding} onSave={onSave} onClose={onClose} />);
    await user.click(screen.getByText("Save"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Save failed");
  });

  it("should disable save button while saving", async () => {
    // Make onSave hang
    onSave.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<EditFeedingModal feeding={mockFeeding} onSave={onSave} onClose={onClose} />);
    await user.click(screen.getByText("Save"));
    expect(screen.getByText("Saving...")).toBeDisabled();
  });
});
