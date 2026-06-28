import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 4h12v12H4V4z" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 8h6M7 11h4" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Plain English breakdown",
    desc: "Every clause translated from legalese to language you can actually understand — no law degree required.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v1M10 16v1M3 10h1M16 10h1M5.05 5.05l.707.707M14.243 14.243l.707.707M5.05 14.95l.707-.707M14.243 5.757l.707-.707" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="10" r="3" stroke="#4F46E5" strokeWidth="1.5" />
      </svg>
    ),
    title: "Risk detection",
    desc: "High-risk clauses flagged instantly with clear explanations of what could hurt you and why.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M17 10c0 3.866-3.134 7-7 7a6.978 6.978 0 01-4-1.253L3 17l1.253-3A6.978 6.978 0 013 10c0-3.866 3.134-7 7-7s7 3.134 7 7z" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7.5 10.5h5M7.5 7.5h3" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Ask anything",
    desc: "Chat with your contract. Get instant answers about any clause, term, or obligation — anytime.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L3 5.5V10c0 4.4 3.1 8.5 7 10 3.9-1.5 7-5.6 7-10V5.5L10 2z" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 10l2 2 4-4" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Negotiation tips",
    desc: "Specific, actionable suggestions on what to push back on and how to phrase it before you sign.",
  },
];

const steps = [
  {
    n: "01",
    title: "Upload your contract",
    desc: "Drop in any rental agreement, employment contract, NDA, or loan document. PDF, DOCX, JPG, or PNG.",
  },
  {
    n: "02",
    title: "AI reads every clause",
    desc: "Our AI analyzes each section, scores risk levels green to red, and translates the legalese.",
  },
  {
    n: "03",
    title: "Understand and negotiate",
    desc: "See what's risky, what's standard, and exactly what to push back on — then ask follow-up questions.",
  },
];

const CONTRACT_TYPES = [
  "Rental agreements",
  "Employment contracts",
  "NDAs",
  "Loan agreements",
  "Freelance contracts",
  "Software licenses",
  "Vendor agreements",
  "Insurance policies",
];

function ShieldLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M14 2.5L4.5 6.5V13C4.5 18.8 8.8 24 14 26C19.2 24 23.5 18.8 23.5 13V6.5L14 2.5Z"
        fill="#4F46E5"
      />
      <path
        d="M10 14L12.5 16.5L18 11"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Landing() {
  const { token } = useAuth();
  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldLogo />
            <span className="font-bold text-xl text-gray-900 tracking-tight">ClauseGuard</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full mb-8">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 0l1.5 4.5H12l-3.75 2.7 1.5 4.5L6 9l-3.75 2.7 1.5-4.5L0 4.5h4.5L6 0z" />
          </svg>
          AI-powered contract analysis
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
          Know what you're signing.
          <br />
          <span className="text-indigo-600">Before you sign it.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload any contract. AI reads every clause, flags the risky parts, and tells you exactly
          what to push back on — in plain English, in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            to="/signup"
            className="w-full sm:w-auto bg-indigo-600 text-white font-semibold text-base px-7 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Analyze your first contract →
          </Link>
          <Link
            to="/login"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Already have an account
          </Link>
        </div>
        <p className="text-sm text-gray-400">
          Supports PDF, DOCX, JPG, PNG &nbsp;·&nbsp; Free to use &nbsp;·&nbsp; No credit card required
        </p>
      </section>

      {/* Contract types ticker */}
      <div className="bg-gray-50 border-y border-gray-100 py-4 overflow-hidden">
        <div className="animate-marquee gap-8 whitespace-nowrap">
          {[...CONTRACT_TYPES, ...CONTRACT_TYPES, ...CONTRACT_TYPES].map((t, i) => (
            <span key={i} className="text-sm text-gray-400 shrink-0 mr-8">
              <span className="text-gray-300 mr-2">✦</span>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to review a contract
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              No more signing documents you don't fully understand. ClauseGuard breaks it all down.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group border border-gray-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-24 px-6 border-y border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-gray-500">Three steps from upload to understanding.</p>
          </div>
          <div className="space-y-10">
            {steps.map((s, i) => (
              <div key={s.n} className="flex gap-6 items-start">
                <div className="shrink-0 w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600">{s.n}</span>
                </div>
                <div className="pt-2">
                  <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-20 px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Stop signing contracts blind.
        </h2>
        <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
          Get plain-English clause analysis, risk scores, and negotiation tips in under a minute.
        </p>
        <Link
          to="/signup"
          className="inline-block bg-white text-indigo-600 font-semibold text-base px-7 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"
        >
          Get started free →
        </Link>
        <p className="text-indigo-300 text-sm mt-4">No credit card required</p>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldLogo size={22} />
            <span className="font-semibold text-gray-700">ClauseGuard</span>
          </div>
          <p className="text-sm text-gray-400 text-center">
            AI-powered contract analysis &nbsp;·&nbsp;{" "}
            <span className="font-medium">Not legal advice</span> — always consult a qualified
            lawyer for important decisions.
          </p>
        </div>
      </footer>
    </div>
  );
}
