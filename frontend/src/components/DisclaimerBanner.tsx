export default function DisclaimerBanner() {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-1">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
        <path
          d="M8 1.5L1.5 13.5h13L8 1.5z"
          stroke="#D97706"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8 6.5v3M8 11v.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p className="text-xs text-amber-800 leading-relaxed">
        <strong className="font-semibold">Not legal advice.</strong> ClauseGuard gives AI-generated
        analysis to help you understand documents in plain English. For anything important, consult a
        qualified lawyer before signing or relying on this.
      </p>
    </div>
  );
}
