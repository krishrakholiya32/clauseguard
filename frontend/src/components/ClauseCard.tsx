import type { Clause } from "../api/client";
import RiskBadge from "./RiskBadge";

const BORDER_COLORS: Record<string, string> = {
  green: "border-l-emerald-400",
  yellow: "border-l-amber-400",
  red: "border-l-red-400",
};

export default function ClauseCard({ clause }: { clause: Clause }) {
  const borderColor = BORDER_COLORS[clause.risk] ?? BORDER_COLORS.yellow;

  return (
    <div className={`border border-gray-200 border-l-4 ${borderColor} rounded-xl p-4 bg-white`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-xs text-gray-400 italic leading-relaxed flex-1">"{clause.text}"</p>
        <RiskBadge risk={clause.risk} />
      </div>
      <p className="text-sm font-medium text-gray-900 mb-1">{clause.plain_english}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{clause.reason}</p>
    </div>
  );
}
