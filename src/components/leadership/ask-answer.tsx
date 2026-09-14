import { BarChart } from "@/components/charts/bar-chart";
import { Markdown } from "@/components/leadership/markdown";
import { AiPill, Card } from "@/components/ui/primitives";
import type { AskAnswer } from "@/lib/ai/ask-school";

/** One answer: narrative, the figures used, and a chart when the topic has one. */
export function AskAnswerCard({ answer }: { answer: AskAnswer }) {
  const highlight = answer.topic === "attendance" ? "min" : "max";
  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink">{answer.question}</p>
        <AiPill live={answer.live} />
      </div>
      <Markdown text={answer.answer} />
      <div className="grid gap-5 border-t border-line pt-5 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-ink-3">Figures used</p>
          <div className="overflow-x-auto">
            <table className="table">
              <tbody>
                {answer.figures.map((f) => (
                  <tr key={f.label}>
                    <td className="text-ink-2">{f.label}</td>
                    <td className="num text-right font-medium">{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {answer.chart ? <BarChart title={answer.chart.title} unit={answer.chart.unit} bars={answer.chart.bars} highlight={highlight} /> : null}
      </div>
    </Card>
  );
}
