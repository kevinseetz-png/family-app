import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationToggle } from "./NotificationToggle";

describe("NotificationToggle", () => {
  it("should render toggle with label", () => {
    render(
      <NotificationToggle
        label="Voedingsherinneringen"
        enabled={false}
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByText("Voedingsherinneringen")).toBeInTheDocument();
  });

  it("should show enabled state", () => {
    render(
      <NotificationToggle
        label="Voedingsherinneringen"
        enabled={true}
        onToggle={vi.fn()}
      />
    );
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("should call onToggle when clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <NotificationToggle
        label="Voedingsherinneringen"
        enabled={false}
        onToggle={onToggle}
      />
    );

    await user.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("should be disabled when disabled prop is true", () => {
    render(
      <NotificationToggle
        label="Voedingsherinneringen"
        enabled={false}
        onToggle={vi.fn()}
        disabled={true}
      />
    );
    const toggle = screen.getByRole("switch");
    expect(toggle).toBeDisabled();
  });
});
