/**
 * Client for the Express backend in apps/backend. Every route is mounted under
 * /api/v1 and the server listens on port 4000. Change this if the backend runs elsewhere.
 */
export const API_BASE_URL = "http://localhost:4000/api/v1";

/** The backend's error bodies look like { message }. Crashes come back as HTML or plain text, so this can return undefined. */
function readMessage(text: string): string | undefined {
  try {
    const body = JSON.parse(text) as { message?: unknown };
    return typeof body.message === "string" ? body.message : undefined;
  } catch {
    return undefined;
  }
}

async function post<T>(
  path: string,
  body: unknown,
  { token, signal }: { token?: string; signal?: AbortSignal } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // The auth middleware reads the raw JWT from the Authorization header. It does not expect a "Bearer " prefix.
  if (token) headers.Authorization = token;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`Can't reach the backend at ${API_BASE_URL}. Is it running?`);
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(readMessage(text) ?? `Request failed with status ${response.status}.`);
  }
  return JSON.parse(text) as T;
}

export const api = {
  /** Creates a user. The response doesn't include a token, so the caller signs in next. */
  signup: (input: { name: string; username: string; password: string }) =>
    post<{ message: string }>("/users/signup", input),

  /** Returns a JWT that expires after one hour. */
  signin: (input: { username: string; password: string }) =>
    post<{ message: string; token: string }>("/users/signin", input),

  /**
   * Runs the whole pipeline (script breakdown, frames, videos) before replying,
   * so this can take several minutes. `image` must be a URL the server can fetch.
   */
  createStory: (input: { image: string; script: string }, token: string) =>
    post<{ message: string }>("/stories/create", input, { token }),

  /**
   * The backend never replies to this route on success. Pass an AbortSignal so
   * the caller can stop waiting.
   */
  createCharacter: (input: { imageUrl: string }, token: string, signal?: AbortSignal) =>
    post<{ message?: string }>("/charecters/create", input, { token, signal }),
};
