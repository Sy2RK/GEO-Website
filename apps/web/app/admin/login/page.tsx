"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientApiPost } from "../../../lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@guru.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ui = searchParams.get("ui") === "en" ? "en" : "zh";
  const nextPath = searchParams.get("next");
  const fallbackPath = `/admin/products?ui=${ui}`;

  useEffect(() => {
    const token = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("guru_token="))
      ?.split("=")[1];

    if (!token) {
      return;
    }

    let cancelled = false;
    const target = nextPath || fallbackPath;

    async function checkSession() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          user?: { role?: "viewer" | "editor" | "admin" };
        };
        if (!cancelled && payload.user?.role && payload.user.role !== "viewer") {
          router.replace(target);
        }
      } catch {
        // Keep user on login page when session check fails.
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [fallbackPath, nextPath, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await clientApiPost<{
        token: string;
        user: { role: "viewer" | "editor" | "admin" };
      }>("/api/auth/login", {
        email,
        password
      });

      document.cookie = `guru_token=${response.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
      router.push(nextPath || fallbackPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "login_failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="card" style={{ maxWidth: 460, margin: "40px auto" }}>
      <h1 style={{ marginTop: 0 }}>{ui === "en" ? "Admin Login" : "后台登录"}</h1>
      <p className="meta">
        {ui === "en"
          ? "Sign in to edit homepage and product canonical content."
          : "登录后可进入首页与产品 canonical 内容编辑。"}
      </p>
      <form onSubmit={submit} className="list">
        <label>
          {ui === "en" ? "Email" : "邮箱"}
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          {ui === "en" ? "Password" : "密码"}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? (ui === "en" ? "Signing in..." : "登录中...") : ui === "en" ? "Sign in" : "登录"}
        </button>
      </form>
      {error ? <p className="warning">{error}</p> : null}
      <p className="meta">
        {ui === "en" ? "Seed users" : "测试账号"}: admin@guru.local / Admin123!
      </p>
    </main>
  );
}
