import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api/client";
import type { DocumentItem } from "../api/client";
import RiskBadge from "../components/RiskBadge";

const STATUS_LABELS: Record<string, string> = {
  pending: "Queued",
  processing: "Analyzing…",
  done: "Ready",
  failed: "Failed",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-gray-300",
  processing: "bg-amber-400 animate-pulse",
  done: "bg-emerald-400",
  failed: "bg-red-400",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  rental: "Rental agreement",
  employment: "Employment contract",
  loan: "Loan agreement",
  freelance: "Freelance / service",
  nda: "NDA",
  sale: "Sale / purchase",
  insurance: "Insurance policy",
  partnership: "Partnership / JV",
  vendor: "Vendor / supplier",
  consulting: "Consulting / advisory",
  software: "Software license",
  other: "Other",
};

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-gray-400">
      <path
        d="M10.5 2H4.5C3.675 2 3 2.675 3 3.5V14.5C3 15.325 3.675 16 4.5 16H13.5C14.325 16 15 15.325 15 14.5V6.5L10.5 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10.5 2V6.5H15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 9.5h6M6 12h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const docs = await api.listDocuments();
      if (active) {
        setDocuments(docs);
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this document and its analysis? This can't be undone.")) return;
    setDeletingId(id);
    try {
      await api.deleteDocument(id);
      setDocuments((docs) => docs.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My documents</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {documents.length > 0
              ? `${documents.length} contract${documents.length === 1 ? "" : "s"} analyzed`
              : "Upload a contract to get started"}
          </p>
        </div>
        <Link
          to="/upload"
          className="bg-indigo-600 text-white font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Analyze contract
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && documents.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                stroke="#4F46E5"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M14 2v6h6M12 11v6M9 14h6" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">No contracts yet</h3>
          <p className="text-gray-500 text-sm mb-5">
            Upload your first contract and get an instant AI analysis.
          </p>
          <Link
            to="/upload"
            className="inline-block bg-indigo-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Upload a contract
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {documents.map((doc) => (
          <Link
            key={doc.id}
            to={`/documents/${doc.id}`}
            className="group flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
              <FileIcon />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{doc.filename}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">
                  {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                </span>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-400">{formatDate(doc.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {doc.analysis && <RiskBadge risk={doc.analysis.overall_risk} />}
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[doc.status]}`} />
                <span className="text-xs text-gray-500">{STATUS_LABELS[doc.status]}</span>
              </div>
              <button
                onClick={(e) => handleDelete(e, doc.id)}
                disabled={deletingId === doc.id}
                className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-40 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                {deletingId === doc.id ? "…" : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 3.5h10M5.5 3.5V2.5h3V3.5M6 6.5v4M8 6.5v4M3 3.5l.5 8h7l.5-8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
