import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import DocumentResult from "./pages/DocumentResult";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ShieldLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
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

function Nav() {
  const { token, logout } = useAuth();
  if (!token) return null;
  return (
    <nav className="sticky top-0 z-20 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ShieldLogo />
          <span className="font-bold text-gray-900 tracking-tight">ClauseGuard</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/upload"
            className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Analyze contract
          </Link>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors px-2 py-2"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Nav />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <ProtectedRoute>
                <DocumentResult />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
