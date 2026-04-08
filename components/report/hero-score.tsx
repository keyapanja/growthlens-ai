import { Card } from "@/components/ui/card";
import { getScoreTone } from "@/lib/utils";

export function HeroScore({
  score,
  url,
  summary
}: {
  score: number;
  url: string;
  summary: string;
}) {
  return (
    <Card className="overflow-hidden p-8 md:p-10">
      <div className="grid gap-8 lg:grid-cols-[220px,1fr]">
        <div className="flex h-48 w-48 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] shadow-glow">
          <div className="text-center">
            <div className={`text-6xl font-semibold ${getScoreTone(score)}`}>{score}</div>
            <div className="mt-2 text-xs uppercase tracking-[0.3em] text-white/45">Growth Score</div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.24em] text-accent">AI growth intelligence</p>
            <h1 className="text-4xl font-semibold text-white md:text-5xl">Your growth report is ready.</h1>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm text-sky-300 transition hover:text-sky-200"
          >
            {url}
          </a>
          <p className="max-w-3xl text-base leading-7 text-white/72">{summary}</p>
        </div>
      </div>
    </Card>
  );
}
