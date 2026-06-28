import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function ShieldLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
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

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password);
      navigate("/dashboard");
    } catch {
      setError("Could not create account. Email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <ShieldLogo />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Start analyzing contracts for free</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <button
              className="w-full bg-indigo-600 text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-xs text-center mt-4 text-gray-400 leading-relaxed px-2">
          By signing up you acknowledge this is an AI tool, not legal advice.
        </p>
        <p className="text-sm text-center mt-3 text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-800">
            Log in
          </Link>
        </p>
        <p className="text-sm text-center mt-2">
          <Link to="/" className="text-gray-400 hover:text-gray-600 text-xs">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
