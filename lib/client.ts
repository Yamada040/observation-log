export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include"
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({ message: "Request failed" }))) as { message?: string };
    throw new Error(body.message || "Request failed");
  }

  const type = res.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as T;
}
