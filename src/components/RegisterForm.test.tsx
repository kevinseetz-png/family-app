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
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders a submit button with 'Sign up' text", () => {
    render(<RegisterForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
  });

  it("renders a switch-to-login button", () => {
    render(<RegisterForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("calls onSwitchToLogin when log in is clicked", async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(defaultProps.onSwitchToLogin).toHaveBeenCalledOnce();
  });

  it("calls onSubmit with name, email, password, and inviteCode", async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...defaultProps} />);
    await user.type(screen.getByLabelText("Invite code"), "TESTCODE");
    await user.type(screen.getByLabelText("Name"), "Alice");
    await user.type(screen.getByLabelText("Email"), "alice@test.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith("Alice", "alice@test.com", "password123", "TESTCODE");
  });

  it("shows error message when onSubmit returns an error", async () => {
    const onSubmit = vi.fn().mockResolvedValue("Email taken");
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={onSubmit} onSwitchToLogin={vi.fn()} />);
    await user.type(screen.getByLabelText("Invite code"), "CODE1");
    await user.type(screen.getByLabelText("Name"), "Bob");
    await user.type(screen.getByLabelText("Email"), "b@b.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email taken");
  });

  it("shows 'Creating account...' while submitting", async () => {
    let resolveSubmit!: (val: string | null) => void;
    const onSubmit = vi.fn(() => new Promise<string | null>((r) => { resolveSubmit = r; }));
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={onSubmit} onSwitchToLogin={vi.fn()} />);
    await user.type(screen.getByLabelText("Invite code"), "CODE1");
    await user.type(screen.getByLabelText("Name"), "X");
    await user.type(screen.getByLabelText("Email"), "x@x.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByRole("button", { name: "Creating account..." })).toBeDisabled();
    resolveSubmit(null);
  });
});
