import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminLoginForm } from "@/app/admin/login/AdminLoginForm";
import { signIn } from "@/lib/auth/client";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

vi.mock("@/lib/auth/client", () => ({
  signIn: {
    email: vi.fn(),
  },
}));

describe("AdminLoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs in with email and password, then opens the admin dashboard", async () => {
    vi.mocked(signIn.email).mockResolvedValue({ data: {}, error: null });

    render(<AdminLoginForm />);

    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "correct horse battery staple");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(signIn.email).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "correct horse battery staple",
      callbackURL: "/admin",
    });
    expect(push).toHaveBeenCalledWith("/admin");
    expect(refresh).toHaveBeenCalled();
  });
});
