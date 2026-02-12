function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
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

function readTokenFromCookie(): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("guru_token="))
    ?.split("=")[1];
}

export async function clientApiPost<T>(
  path: string,
  body: Record<string, unknown>,
  options?: {
    token?: string;
    method?: "POST" | "PATCH";
  }
): Promise<T> {
  const token = options?.token ?? readTokenFromCookie();

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
  const token = readTokenFromCookie();

  const response = await fetch(`${getApiBaseUrl()}${path}${toQueryString(params)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  if (!response.ok) {
    throw new Error(`client_api_get_failed:${response.status}`);
  }

  return (await response.json()) as T;
}

export async function clientApiDelete(path: string, options?: { token?: string }): Promise<void> {
  const token = options?.token ?? readTokenFromCookie();
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  if (!response.ok) {
    throw new Error(`client_api_delete_failed:${response.status}`);
  }
}
