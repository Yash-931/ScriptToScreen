import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { formatDuration, useElapsed } from "../hooks/useElapsed";
import { api } from "../lib/api";
import { Alert, Button, Card, Field, Input, Spinner } from "./ui";

/** /charecters/create never replies on success, so stop waiting after this long. */
const NO_REPLY_TIMEOUT_MS = 30_000;

type CharacterResult = { kind: "reply"; message?: string } | { kind: "no-reply" };

export function CharacterForm({ token }: { token: string }) {
  const [imageUrl, setImageUrl] = useState("");

  const character = useMutation({
    mutationFn: async (): Promise<CharacterResult> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), NO_REPLY_TIMEOUT_MS);
      try {
        const { message } = await api.createCharacter({ imageUrl: imageUrl.trim() }, token, controller.signal);
        return { kind: "reply", message };
      } catch (error) {
        if (controller.signal.aborted) return { kind: "no-reply" };
        throw error;
      } finally {
        clearTimeout(timer);
      }
    },
  });
  const elapsed = useElapsed(character.isPending);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    character.mutate();
  }

  return (
    <Card className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold">Create a character</h2>
        <p className="text-sm text-zinc-400">
          Sends a reference photo to <span className="font-mono text-zinc-300">/charecters/create</span> to generate a
          side-profile portrait.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Reference photo URL" htmlFor="character-image">
          <Input
            id="character-image"
            type="url"
            required
            placeholder="https://example.com/face.jpg"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
          />
        </Field>

        <Button type="submit" className="w-full" disabled={character.isPending}>
          {character.isPending && <Spinner />}
          Generate side profile
        </Button>
      </form>

      {character.isPending && (
        <Alert tone="info">
          <p className="font-medium">Waiting for the server · {formatDuration(elapsed)}</p>
        </Alert>
      )}

      {character.isError && <Alert tone="error">{character.error.message}</Alert>}

      {character.data?.kind === "reply" && <Alert tone="success">{character.data.message ?? "Done."}</Alert>}

      {character.data?.kind === "no-reply" && (
        <Alert tone="info">
          <p className="font-medium">No reply after {NO_REPLY_TIMEOUT_MS / 1000} seconds.</p>
          <p className="mt-1 opacity-80">
            This route doesn&apos;t send a response on success yet, and the generated image isn&apos;t returned or
            saved. The request may still finish on the server.
          </p>
        </Alert>
      )}
    </Card>
  );
}
