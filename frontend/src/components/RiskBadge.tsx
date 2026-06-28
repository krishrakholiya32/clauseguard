const STYLES: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  yellow: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
};

const LABELS: Record<string, string> = {
  green: "Looks fine",
  yellow: "Worth reviewing",
  red: "High risk",
};

const DOTS: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
};

export default function RiskBadge({ risk }: { risk: string }) {
  const style = STYLES[risk] ?? STYLES.yellow;
  const label = LABELS[risk] ?? risk;
  const dot = DOTS[risk] ?? DOTS.yellow;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
