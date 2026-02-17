import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PicnicLogin } from "./PicnicLogin";

/**
 * @vitest-environment jsdom
 */

describe("PicnicLogin", () => {
  const mockOnLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login form", () => {
    render(<PicnicLogin onLogin={mockOnLogin} />);

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wachtwoord/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verbinden/i })).toBeInTheDocument();
  });

  it("should call onLogin with credentials when submitted", async () => {
    mockOnLogin.mockResolvedValue(undefined);
    render(<PicnicLogin onLogin={mockOnLogin} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "test@picnic.nl");
    await user.type(screen.getByLabelText(/wachtwoord/i), "mypassword");
    await user.click(screen.getByRole("button", { name: /verbinden/i }));

    expect(mockOnLogin).toHaveBeenCalledWith("test@picnic.nl", "mypassword");
  });

  it("should show error message on failed login", async () => {
    mockOnLogin.mockRejectedValue(new Error("Ongeldige inloggegevens"));
    render(<PicnicLogin onLogin={mockOnLogin} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "test@picnic.nl");
    await user.type(screen.getByLabelText(/wachtwoord/i), "wrong");
    await user.click(screen.getByRole("button", { name: /verbinden/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/ongeldige inloggegevens/i);
  });

  it("should disable button while submitting", async () => {
    let resolveLogin!: () => void;
    mockOnLogin.mockReturnValue(new Promise<void>((r) => { resolveLogin = r; }));
    render(<PicnicLogin onLogin={mockOnLogin} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/e-mail/i), "test@picnic.nl");
    await user.type(screen.getByLabelText(/wachtwoord/i), "pass");
    await user.click(screen.getByRole("button", { name: /verbinden/i }));

    expect(screen.getByRole("button", { name: /verbinden/i })).toBeDisabled();
    resolveLogin!();
  });
});
