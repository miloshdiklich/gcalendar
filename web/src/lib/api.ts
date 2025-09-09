export const API = {
  base: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000",
};

// better to use something like axios with interceptors
const handle = async (res: Response) => {
  if (res.status === 401) {
    // Not authenticated: bounce to login route
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res;
};

// types would be nice
export const getEvents = async (rangeDays = 7) => {
  const res = await fetch(`${API.base}/events?rangeDays=${rangeDays}`, {
    credentials: "include",
  }).then(handle);
  const data = (await res.json()) as { events: any[] };
  return data.events;
};

export const refreshEvents = async () => {
  await fetch(`${API.base}/events/refresh`, {
    method: "POST",
    credentials: "include",
  }).then(handle);
};

export const createEvent = async (input: {
  summary: string;
  date: string;
  startTime: string;
  endTime: string;
  timeZone?: string;
}) => {
  await fetch(`${API.base}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  }).then(handle);
};

export const getMe = async () => {
  const res = await fetch(`${API.base}/auth/me`, { credentials: "include" });
  if (res.status === 401) { window.location.href = "/login"; throw new Error("Unauthorized"); }
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return (await res.json()) as { user: { displayName: string; email: string; photoUrl: string | null } };
};

export const logout = async () => {
  const res = await fetch(`${API.base}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
};

