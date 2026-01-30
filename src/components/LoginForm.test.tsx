import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(null),
    onSwitchToRegister: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields with labels", () => {
    render(<LoginForm {...defaultProps} />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders a submit button with 'Log in' text", () => {
    render(<LoginForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("renders a switch-to-register button", () => {
    render(<LoginForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });

  it("calls onSwitchToRegister when create account is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(defaultProps.onSwitchToRegister).toHaveBeenCalledOnce();
  });

  it("calls onSubmit with email and password", async () => {
    const user = userEvent.setup();
    render(<LoginForm {...defaultProps} />);
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith("test@example.com", "secret");
  });

  it("shows error message when onSubmit returns an error", async () => {
    const onSubmit = vi.fn().mockResolvedValue("Invalid credentials");
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} onSwitchToRegister={vi.fn()} />);
    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
  });

  it("disables submit button while submitting", async () => {
    let resolveSubmit!: (val: string | null) => void;
    const onSubmit = vi.fn(() => new Promise<string | null>((r) => { resolveSubmit = r; }));
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} onSwitchToRegister={vi.fn()} />);
    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Password"), "pw");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByRole("button", { name: "Logging in..." })).toBeDisabled();
    resolveSubmit(null);
  });
});
