import type { Clause } from "../api/client";
import RiskBadge from "./RiskBadge";

export default function ClauseCard({ clause }: { clause: Clause }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-3 bg-white">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-sm text-gray-500 italic flex-1">"{clause.text}"</p>
        <RiskBadge risk={clause.risk} />
      </div>
      <p className="text-gray-900 mb-1">{clause.plain_english}</p>
      <p className="text-sm text-gray-600">{clause.reason}</p>
    </div>
  );
}
