import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MedicijnPage from "./page";

/**
 * @vitest-environment jsdom
 */

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuthContext: vi.fn(),
}));

vi.mock("@/hooks/useMedicines", () => ({
  useMedicines: vi.fn(),
}));

import { useAuthContext } from "@/components/AuthProvider";
import { useMedicines } from "@/hooks/useMedicines";

const mockUseAuthContext = vi.mocked(useAuthContext);
const mockUseMedicines = vi.mocked(useMedicines);

const mockAuthContextBase = {
  logout: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  visibleTabs: null,
  updateVisibleTabs: vi.fn(),
};

const mockUseMedicinesBase = {
  medicines: [],
  isLoading: false,
  error: null,
  addMedicine: vi.fn(),
  updateMedicine: vi.fn(),
  deleteMedicine: vi.fn(),
  toggleCheck: vi.fn(),
  refetch: vi.fn(),
};

describe("MedicijnPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to login when not authenticated", async () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: null,
      isLoading: false,
    });

    mockUseMedicines.mockReturnValue(mockUseMedicinesBase);

    render(<MedicijnPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("should show loading spinner while loading", () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: null,
      isLoading: true,
    });

    mockUseMedicines.mockReturnValue({
      ...mockUseMedicinesBase,
      isLoading: true,
    });

    render(<MedicijnPage />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("should render page title and add form", async () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMedicines.mockReturnValue(mockUseMedicinesBase);

    render(<MedicijnPage />);

    expect(screen.getByRole("heading", { name: /medicijn/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/medicijn naam/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /toevoegen/i })).toBeInTheDocument();
  });

  it("should display list of medicines", async () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMedicines.mockReturnValue({
      ...mockUseMedicinesBase,
      medicines: [
        {
          id: "med1",
          familyId: "fam1",
          name: "Paracetamol",
          reminderHour: 9,
          reminderMinute: 0,
          active: true,
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
          checkedToday: false,
        },
        {
          id: "med2",
          familyId: "fam1",
          name: "Ibuprofen",
          reminderHour: 21,
          reminderMinute: 30,
          active: true,
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
          checkedToday: true,
          checkedByName: "Test User",
        },
      ],
    });

    render(<MedicijnPage />);

    expect(screen.getByText("Paracetamol")).toBeInTheDocument();
    expect(screen.getByText("Ibuprofen")).toBeInTheDocument();
    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("21:30")).toBeInTheDocument();
  });

  it("should show checked state for medicines taken today", async () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMedicines.mockReturnValue({
      ...mockUseMedicinesBase,
      medicines: [
        {
          id: "med1",
          familyId: "fam1",
          name: "Paracetamol",
          reminderHour: 9,
          reminderMinute: 0,
          active: true,
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
          checkedToday: true,
          checkedByName: "Test User",
        },
      ],
    });

    render(<MedicijnPage />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("should call addMedicine when form is submitted", async () => {
    const mockAddMedicine = vi.fn().mockResolvedValue(undefined);

    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMedicines.mockReturnValue({
      ...mockUseMedicinesBase,
      addMedicine: mockAddMedicine,
    });

    render(<MedicijnPage />);

    const input = screen.getByPlaceholderText(/medicijn naam/i);
    const button = screen.getByRole("button", { name: /toevoegen/i });

    await userEvent.type(input, "New Medicine");
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockAddMedicine).toHaveBeenCalledWith("New Medicine", expect.any(Number), expect.any(Number));
    });
  });

  it("should call toggleCheck when checkbox is clicked", async () => {
    const mockToggleCheck = vi.fn().mockResolvedValue(undefined);

    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMedicines.mockReturnValue({
      ...mockUseMedicinesBase,
      medicines: [
        {
          id: "med1",
          familyId: "fam1",
          name: "Paracetamol",
          reminderHour: 9,
          reminderMinute: 0,
          active: true,
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
          checkedToday: false,
        },
      ],
      toggleCheck: mockToggleCheck,
    });

    render(<MedicijnPage />);

    const checkbox = screen.getByRole("checkbox");
    await userEvent.click(checkbox);

    expect(mockToggleCheck).toHaveBeenCalledWith("med1");
  });

  it("should call deleteMedicine when delete button is clicked", async () => {
    const mockDeleteMedicine = vi.fn().mockResolvedValue(undefined);

    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMedicines.mockReturnValue({
      ...mockUseMedicinesBase,
      medicines: [
        {
          id: "med1",
          familyId: "fam1",
          name: "Paracetamol",
          reminderHour: 9,
          reminderMinute: 0,
          active: true,
          createdBy: "user1",
          createdByName: "Test User",
          createdAt: new Date(),
          checkedToday: false,
        },
      ],
      deleteMedicine: mockDeleteMedicine,
    });

    render(<MedicijnPage />);

    const deleteButton = screen.getByRole("button", { name: /verwijder/i });
    await userEvent.click(deleteButton);

    expect(mockDeleteMedicine).toHaveBeenCalledWith("med1");
  });

  it("should display error message when error occurs", () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMedicines.mockReturnValue({
      ...mockUseMedicinesBase,
      error: "Failed to load medicines",
    });

    render(<MedicijnPage />);

    expect(screen.getByText("Failed to load medicines")).toBeInTheDocument();
  });

  it("should show empty state when no medicines", () => {
    mockUseAuthContext.mockReturnValue({
      ...mockAuthContextBase,
      user: {
        id: "user1",
        name: "Test User",
        email: "test@example.com",
        familyId: "fam1",
        role: "member",
      },
      isLoading: false,
    });

    mockUseMedicines.mockReturnValue(mockUseMedicinesBase);

    render(<MedicijnPage />);

    expect(screen.getByText(/geen medicijnen/i)).toBeInTheDocument();
  });
});
