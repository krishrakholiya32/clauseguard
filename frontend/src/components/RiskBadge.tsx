const STYLES: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red: "bg-red-100 text-red-800 border-red-300",
};

const LABELS: Record<string, string> = {
  green: "Looks fine",
  yellow: "Worth reviewing",
  red: "High risk",
};

export default function RiskBadge({ risk }: { risk: string }) {
  const style = STYLES[risk] || STYLES.yellow;
  const label = LABELS[risk] || risk;
  return (
    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full border ${style}`}>
      {label}
    </span>
  );
}
