import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./RegisterForm";

describe("RegisterForm invite-only", () => {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(null),
    onSwitchToLogin: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an invite code input field", () => {
    render(<RegisterForm {...defaultProps} />);
    expect(screen.getByLabelText("Uitnodigingscode")).toBeInTheDocument();
  });

  it("shows a message that an invite code is required", () => {
    render(<RegisterForm {...defaultProps} />);
    expect(screen.getByText("Je hebt een uitnodigingscode nodig")).toBeInTheDocument();
  });

  it("calls onSubmit with name, email, password, and inviteCode", async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...defaultProps} />);
    await user.type(screen.getByLabelText("Uitnodigingscode"), "VALIDCODE");
    await user.type(screen.getByLabelText("Naam"), "Alice");
    await user.type(screen.getByLabelText("E-mail"), "alice@test.com");
    await user.type(screen.getByLabelText("Wachtwoord"), "password123");
    await user.click(screen.getByRole("button", { name: "Registreren" }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith("Alice", "alice@test.com", "password123", "VALIDCODE");
  });

  it("shows error when submitting with invalid invite code", async () => {
    const onSubmit = vi.fn().mockResolvedValue("Invalid or expired invite code");
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={onSubmit} onSwitchToLogin={vi.fn()} />);
    await user.type(screen.getByLabelText("Uitnodigingscode"), "BADCODE");
    await user.type(screen.getByLabelText("Naam"), "Bob");
    await user.type(screen.getByLabelText("E-mail"), "bob@test.com");
    await user.type(screen.getByLabelText("Wachtwoord"), "password123");
    await user.click(screen.getByRole("button", { name: "Registreren" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid or expired invite code");
  });
});
