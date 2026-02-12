import { cookies } from "next/headers";

export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
}

function toQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) {
    return "";
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    query.set(key, String(value));
  }

  const text = query.toString();
  return text ? `?${text}` : "";
}

export async function getServerToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("guru_token")?.value;
}

export async function apiGet<T>(
  path: string,
  options?: {
    params?: Record<string, string | number | boolean | undefined>;
    token?: string;
    revalidate?: number;
  }
): Promise<T> {
  const token = options?.token ?? (await getServerToken());
  const response = await fetch(`${getApiBaseUrl()}${path}${toQueryString(options?.params)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    next: options?.revalidate ? { revalidate: options.revalidate } : { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`api_get_failed:${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPost<T>(
  path: string,
  body: Record<string, unknown>,
  options?: {
    token?: string;
    method?: "POST" | "PATCH";
  }
): Promise<T> {
  const token = options?.token ?? (await getServerToken());
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options?.method ?? "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await response.json());
    } catch {
      detail = await response.text();
    }
    throw new Error(`api_post_failed:${response.status}:${detail}`);
  }

  return (await response.json()) as T;
}

export async function clientApiPost<T>(
  path: string,
  body: Record<string, unknown>,
  options?: {
    token?: string;
    method?: "POST" | "PATCH";
  }
): Promise<T> {
  const token =
    options?.token ??
    (typeof window !== "undefined"
      ? document.cookie
          .split(";")
          .map((item) => item.trim())
          .find((item) => item.startsWith("guru_token="))
          ?.split("=")[1]
      : undefined);

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options?.method ?? "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`client_api_post_failed:${response.status}`);
  }

  return (await response.json()) as T;
}

export async function clientApiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? document.cookie
          .split(";")
          .map((item) => item.trim())
          .find((item) => item.startsWith("guru_token="))
          ?.split("=")[1]
      : undefined;

  const response = await fetch(`${getApiBaseUrl()}${path}${toQueryString(params)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  if (!response.ok) {
    throw new Error(`client_api_get_failed:${response.status}`);
  }

  return (await response.json()) as T;
}
