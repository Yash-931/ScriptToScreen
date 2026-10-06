import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api } from "../lib/api";
import type { Session } from "../lib/session";
import { Alert, Button, Card, cx, Field, Input, Spinner } from "./ui";

type Mode = "signin" | "signup";

const TABS: { mode: Mode; label: string }[] = [
  { mode: "signin", label: "Sign in" },
  { mode: "signup", label: "Create account" },
];

const PIPELINE_STEPS = [
  "Gemini breaks the script into storyboard scenes.",
  "Gemini renders each scene as a starter frame that keeps your character's face.",
  "Veo 3.1 animates every frame into a short 16:9 clip.",
];

type AuthPanelProps = {
  notice: string | null;
  onSignedIn: (session: Session) => void;
};

export function AuthPanel({ notice, onSignedIn }: AuthPanelProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const auth = useMutation({
    mutationFn: async (): Promise<Session> => {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) throw new Error("Enter a username.");
      if (mode === "signup" && !name.trim()) throw new Error("Enter your name.");

      const credentials = { username: trimmedUsername, password };
      if (mode === "signup") {
        await api.signup({ name: name.trim(), ...credentials });
      }
      // Signup doesn't return a token, so sign in straight after creating the account.
      const { token } = await api.signin(credentials);
      return { token, username: trimmedUsername };
    },
    onSuccess: onSignedIn,
  });

  function switchMode(next: Mode) {
    setMode(next);
    auth.reset();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    auth.mutate();
  }

  const isSignup = mode === "signup";

  return (
    <div className="grid items-center gap-12 py-12 lg:grid-cols-2 lg:py-20">
      <section className="space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-400">Script → storyboard → video</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">From script to screen.</h1>
          <p className="max-w-md text-lg text-zinc-400">
            Paste a short script and a character photo. ScriptToScreen turns them into an animated sequence, one
            scene at a time.
          </p>
        </div>

        <ol className="space-y-4">
          {PIPELINE_STEPS.map((step, index) => (
            <li key={step} className="flex gap-4 text-zinc-300">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-amber-400/40 text-xs font-medium text-amber-400">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <Card>
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-950/60 p-1 text-sm">
          {TABS.map((tab) => (
            <button
              key={tab.mode}
              type="button"
              role="tab"
              aria-selected={mode === tab.mode}
              onClick={() => switchMode(tab.mode)}
              className={cx(
                "rounded-md py-1.5 font-medium transition",
                mode === tab.mode ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {notice && <Alert tone="info">{notice}</Alert>}

          {isSignup && (
            <Field label="Name" htmlFor="name">
              <Input
                id="name"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
          )}

          <Field label="Username" htmlFor="username">
            <Input
              id="username"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          {auth.isError && <Alert tone="error">{auth.error.message}</Alert>}

          <Button type="submit" className="w-full" disabled={auth.isPending}>
            {auth.isPending && <Spinner />}
            {isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
