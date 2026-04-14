import { Card } from "@/components/ui/card";
import { getScoreTone } from "@/lib/utils";

export function MetricBox({
  label,
  value,
  score
}: {
  label: string;
  value: string;
  score: number;
}) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-[0.24em] text-white/40">{label}</div>
      <div className={`mt-3 text-3xl font-semibold ${getScoreTone(score)}`}>{value}</div>
    </Card>
  );
}
