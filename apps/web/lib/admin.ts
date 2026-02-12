import { redirect } from "next/navigation";
import { apiGet, getServerToken } from "./api";

export type SessionUser = {
  id: string;
  email: string;
  role: "viewer" | "editor" | "admin";
};

export async function requireEditorSession(): Promise<{ token: string; user: SessionUser }> {
  const token = await getServerToken();
  if (!token) {
    redirect("/admin/login");
  }

  try {
    const response = await apiGet<{ user: SessionUser }>("/api/auth/me", {
      token
    });

    if (response.user.role === "viewer") {
      throw new Error("insufficient_role");
    }

    return {
      token,
      user: response.user
    };
  } catch {
    redirect("/admin/login");
  }
}
