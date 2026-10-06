import { CharacterForm } from "./CharacterForm";
import { StoryForm } from "./StoryForm";

export function StudioPanel({ token }: { token: string }) {
  return (
    <div className="space-y-8 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Studio</h1>
        <p className="text-zinc-400">Turn a script and a character photo into storyboard frames and video clips.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <StoryForm token={token} />
        <CharacterForm token={token} />
      </div>
    </div>
  );
}
