import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { User } from "@/types/auth";

let mockUser: User | null = null;
let mockIsLoading = false;
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuthContext: () => ({
    user: mockUser,
    isLoading: mockIsLoading,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

global.fetch = vi.fn();
global.confirm = vi.fn();

import AdminDashboard from "./page";

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockIsLoading = false;
    mockUser = null;
    vi.mocked(global.confirm).mockReturnValue(false);
    vi.mocked(global.fetch).mockClear();
  });

  it("should redirect to home when user is not admin", async () => {
    mockUser = {
      id: "user123",
      name: "Member",
      email: "member@test.com",
      familyId: "fam1",
      role: "member",
    };

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("should show loading state when user is loading", () => {
    mockIsLoading = true;
    mockUser = null;

    render(<AdminDashboard />);

    expect(screen.getByText("Laden...")).toBeInTheDocument();
  });

  it("should fetch and display families when user is admin", async () => {
    mockUser = {
      id: "admin123",
      name: "Admin",
      email: "admin@test.com",
      familyId: "fam1",
      role: "admin",
    };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          families: [
            { id: "fam1", name: "Familie Een", memberCount: 3, createdAt: "2024-01-01" },
            { id: "fam2", name: "Familie Twee", memberCount: 1, createdAt: "2024-01-02" },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      } as Response);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Beheerder")).toBeInTheDocument();
    });

    expect(screen.getByText("Families")).toBeInTheDocument();
    expect(screen.getByText("Familie Een")).toBeInTheDocument();
    expect(screen.getByText("Familie Twee")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should fetch and display users when user is admin", async () => {
    mockUser = {
      id: "admin123",
      name: "Admin",
      email: "admin@test.com",
      familyId: "fam1",
      role: "admin",
    };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ families: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [
            {
              id: "user1",
              name: "Jan Jansen",
              email: "jan@test.com",
              familyId: "fam1",
              role: "member",
              createdAt: "2024-01-01",
            },
            {
              id: "admin123",
              name: "Admin",
              email: "admin@test.com",
              familyId: "fam1",
              role: "admin",
              createdAt: "2024-01-02",
            },
          ],
        }),
      } as Response);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Gebruikers")).toBeInTheDocument();
    });

    expect(screen.getByText("Jan Jansen")).toBeInTheDocument();
    expect(screen.getByText("jan@test.com")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("admin@test.com")).toBeInTheDocument();
  });

  it("should move user to target family when move button clicked", async () => {
    const user = userEvent.setup();
    mockUser = {
      id: "admin123",
      name: "Admin",
      email: "admin@test.com",
      familyId: "fam1",
      role: "admin",
    };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          families: [
            { id: "fam1", name: "Familie Een", memberCount: 2 },
            { id: "fam2", name: "Familie Twee", memberCount: 1 },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [
            {
              id: "user1",
              name: "Jan",
              email: "jan@test.com",
              familyId: "fam1",
              role: "member",
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "User moved successfully" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ families: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      } as Response);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Jan")).toBeInTheDocument();
    });

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "fam2");

    const moveButtons = screen.getAllByText("Verplaatsen");
    await user.click(moveButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/users",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ userId: "user1", targetFamilyId: "fam2" }),
        })
      );
    });
  });

  it("should delete user when delete button clicked and confirmed", async () => {
    const user = userEvent.setup();
    mockUser = {
      id: "admin123",
      name: "Admin",
      email: "admin@test.com",
      familyId: "fam1",
      role: "admin",
    };

    vi.mocked(global.confirm).mockReturnValue(true);

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ families: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [
            {
              id: "user1",
              name: "Jan",
              email: "jan@test.com",
              familyId: "fam1",
              role: "member",
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "User deleted successfully" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ families: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      } as Response);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Jan")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Verwijderen");
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith(
        "Weet je zeker dat je deze gebruiker wilt verwijderen?"
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/users",
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify({ userId: "user1" }),
        })
      );
    });
  });

  it("should not delete user when delete not confirmed", async () => {
    const user = userEvent.setup();
    mockUser = {
      id: "admin123",
      name: "Admin",
      email: "admin@test.com",
      familyId: "fam1",
      role: "admin",
    };

    vi.mocked(global.confirm).mockReturnValue(false);

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ families: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [
            {
              id: "user1",
              name: "Jan",
              email: "jan@test.com",
              familyId: "fam1",
              role: "member",
            },
          ],
        }),
      } as Response);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Jan")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Verwijderen");
    await user.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(2); // Only initial fetches, no delete
  });
});
