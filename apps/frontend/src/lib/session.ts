/** Signed-in state, kept in localStorage so a refresh doesn't sign the user out. */
export type Session = { token: string; username: string };

const STORAGE_KEY = "scripttoscreen:session";

/** When the JWT expires, in ms since the epoch. Returns null if the token can't be read. */
export function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1] ?? "";
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: unknown };
    return typeof claims.exp === "number" ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Returns the stored session, or null if there is none or its token has expired. */
export function loadSession(): Session | null {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Session | null;
    if (!session) return null;
    const expiresAt = tokenExpiry(session.token);
    if (expiresAt === null || expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage may be blocked (private mode, disabled site data). The session then lasts until reload.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
