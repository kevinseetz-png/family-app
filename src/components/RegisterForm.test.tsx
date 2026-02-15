import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./RegisterForm";

describe("RegisterForm", () => {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(null),
    onSwitchToLogin: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders name, email, and password fields", () => {
    render(<RegisterForm {...defaultProps} />);
    expect(screen.getByLabelText("Naam")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Wachtwoord")).toBeInTheDocument();
  });

  it("renders a submit button with 'Registreren' text", () => {
    render(<RegisterForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Registreren" })).toBeInTheDocument();
  });

  it("renders a switch-to-login button", () => {
    render(<RegisterForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Inloggen" })).toBeInTheDocument();
  });

  it("calls onSwitchToLogin when log in is clicked", async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: "Inloggen" }));
    expect(defaultProps.onSwitchToLogin).toHaveBeenCalledOnce();
  });

  it("calls onSubmit with name, email, password, and inviteCode", async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...defaultProps} />);
    await user.type(screen.getByLabelText("Uitnodigingscode"), "TESTCODE");
    await user.type(screen.getByLabelText("Naam"), "Alice");
    await user.type(screen.getByLabelText("E-mail"), "alice@test.com");
    await user.type(screen.getByLabelText("Wachtwoord"), "password123");
    await user.click(screen.getByRole("button", { name: "Registreren" }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith("Alice", "alice@test.com", "password123", "TESTCODE");
  });

  it("shows error message when onSubmit returns an error", async () => {
    const onSubmit = vi.fn().mockResolvedValue("Email taken");
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={onSubmit} onSwitchToLogin={vi.fn()} />);
    await user.type(screen.getByLabelText("Uitnodigingscode"), "CODE1");
    await user.type(screen.getByLabelText("Naam"), "Bob");
    await user.type(screen.getByLabelText("E-mail"), "b@b.com");
    await user.type(screen.getByLabelText("Wachtwoord"), "password123");
    await user.click(screen.getByRole("button", { name: "Registreren" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email taken");
  });

  it("shows 'Account aanmaken...' while submitting", async () => {
    let resolveSubmit!: (val: string | null) => void;
    const onSubmit = vi.fn(() => new Promise<string | null>((r) => { resolveSubmit = r; }));
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={onSubmit} onSwitchToLogin={vi.fn()} />);
    await user.type(screen.getByLabelText("Uitnodigingscode"), "CODE1");
    await user.type(screen.getByLabelText("Naam"), "X");
    await user.type(screen.getByLabelText("E-mail"), "x@x.com");
    await user.type(screen.getByLabelText("Wachtwoord"), "password123");
    await user.click(screen.getByRole("button", { name: "Registreren" }));
    expect(screen.getByRole("button", { name: "Account aanmaken..." })).toBeDisabled();
    resolveSubmit(null);
  });
});
