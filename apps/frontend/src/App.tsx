import { useEffect, useState } from "react";
import { AuthPanel } from "./components/AuthPanel";
import { StudioPanel } from "./components/StudioPanel";
import { Button } from "./components/ui";
import { clearSession, loadSession, saveSession, tokenExpiry, type Session } from "./lib/session";

export function App() {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [notice, setNotice] = useState<string | null>(null);

  function signIn(next: Session) {
    saveSession(next);
    setNotice(null);
    setSession(next);
  }

  function signOut(reason: string | null = null) {
    clearSession();
    setNotice(reason);
    setSession(null);
  }

  // Tokens last one hour. Sign out when one expires instead of letting the next request fail.
  useEffect(() => {
    if (!session) return;
    const expiresAt = tokenExpiry(session.token);
    if (expiresAt === null) return;
    const timer = setTimeout(
      () => signOut("Your session expired. Please sign in again."),
      expiresAt - Date.now(),
    );
    return () => clearTimeout(timer);
  }, [session]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-5">
        <div className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-amber-400 text-zinc-950">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-3.5">
              <path d="M8 5.5v13l10.5-6.5z" />
            </svg>
          </span>
          ScriptToScreen
        </div>

        {session && (
          <div className="flex min-w-0 items-center gap-3 text-sm text-zinc-400">
            <span className="truncate">
              Signed in as <span className="font-medium text-zinc-100">{session.username}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20">
        {session ? (
          <StudioPanel token={session.token} />
        ) : (
          <AuthPanel notice={notice} onSignedIn={signIn} />
        )}
      </main>
    </div>
  );
}
