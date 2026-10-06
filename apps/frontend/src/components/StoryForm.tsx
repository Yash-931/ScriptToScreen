import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { formatDuration, useElapsed } from "../hooks/useElapsed";
import { api } from "../lib/api";
import { Alert, Button, Card, Field, Input, Spinner, Textarea } from "./ui";

const SAMPLE_SCRIPT = `INT. ABANDONED SUBWAY PLATFORM - NIGHT

Mira, a courier in a yellow raincoat, walks alone along a flickering platform. Her breath fogs in the cold air.

A train horn echoes from the dark tunnel. She stops, pressing a sealed envelope against her chest.

She steps onto the tracks and runs toward the approaching light, the envelope slipping from her fingers.

On the far platform, a small brass key waits on a bench. Mira picks it up, smiles, and vanishes into the tunnel as the lights go out.`;

export function StoryForm({ token }: { token: string }) {
  const [image, setImage] = useState("");
  const [script, setScript] = useState("");

  const story = useMutation({
    mutationFn: async () => {
      const trimmedScript = script.trim();
      if (!trimmedScript) throw new Error("Write a script first.");
      return api.createStory({ image: image.trim(), script: trimmedScript }, token);
    },
  });
  const elapsed = useElapsed(story.isPending);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    story.mutate();
  }

  return (
    <Card className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold">Create a story</h2>
        <p className="text-sm text-zinc-400">Breaks your script into scenes and renders a clip for each one.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Field
          label="Character image URL"
          htmlFor="story-image"
          hint="A public link to a reference image. The backend downloads it, so the server has to be able to reach it."
        >
          <Input
            id="story-image"
            type="url"
            required
            placeholder="https://example.com/character.png"
            value={image}
            onChange={(event) => setImage(event.target.value)}
          />
        </Field>

        <Field label="Script" htmlFor="story-script">
          <Textarea
            id="story-script"
            required
            rows={10}
            placeholder="Write a short scene, or load the sample."
            value={script}
            onChange={(event) => setScript(event.target.value)}
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => setScript(SAMPLE_SCRIPT)}>
            Load sample script
          </Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={story.isPending}>
            {story.isPending && <Spinner />}
            Generate video
          </Button>
        </div>
      </form>

      {story.isPending && (
        <Alert tone="info">
          <p className="font-medium">Running the pipeline · {formatDuration(elapsed)}</p>
          <p className="mt-1 opacity-80">
            The server replies only after every scene is rendered and animated, which takes several minutes. Keep this
            tab open.
          </p>
        </Alert>
      )}

      {story.isError && <Alert tone="error">{story.error.message}</Alert>}

      {story.isSuccess && (
        <Alert tone="success">
          <p className="font-medium">Pipeline finished.</p>
          <p className="mt-1 opacity-80">
            The API returns only a status message. The clips are saved to your storage bucket under uploads/videos/.
          </p>
        </Alert>
      )}
    </Card>
  );
}
