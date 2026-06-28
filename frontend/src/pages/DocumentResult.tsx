import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import * as api from "../api/client";
import type { DocumentItem } from "../api/client";
import DisclaimerBanner from "../components/DisclaimerBanner";
import RiskBadge from "../components/RiskBadge";
import ClauseCard from "../components/ClauseCard";
import ChatBox from "../components/ChatBox";

function Spinner() {
  return (
    <div className="flex items-center gap-3 text-gray-500">
      <svg className="animate-spin" width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="#e5e7eb" strokeWidth="2.5" />
        <path d="M9 2a7 7 0 017 7" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="text-sm">Analyzing your document, this usually takes under a minute…</span>
    </div>
  );
}

export default function DocumentResult() {
  const { id } = useParams();
  const documentId = Number(id);
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDelete = async () => {
    if (!confirm("Delete this document and its analysis? This can't be undone.")) return;
    setDeleting(true);
    try {
      await api.deleteDocument(documentId);
      navigate("/dashboard");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const d = await api.getDocument(documentId);
        if (!active) return;
        setDoc(d);
        if (d.status === "pending" || d.status === "processing") {
          timerRef.current = setTimeout(load, 3000);
        }
      } catch {
        if (active) setLoadError(true);
      }
    };

    load();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [documentId]);

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mb-8">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to documents
        </Link>
        <div className="p-5 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-red-700 font-medium text-sm mb-1">Document not found</p>
          <p className="text-red-600 text-sm">This document may have been deleted or doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-100 rounded w-24" />
          <div className="h-8 bg-gray-100 rounded w-2/3" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 pb-16">
      <div className="flex items-start justify-between gap-4 mb-2">
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to documents
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50 flex items-center gap-1 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M5.5 3.5V2.5h3V3.5M6 6.5v4M8 6.5v4M3 3.5l.5 8h7l.5-8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-5 leading-snug break-words">{doc.filename}</h1>

      <DisclaimerBanner />

      {(doc.status === "pending" || doc.status === "processing") && (
        <div className="mt-6 p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
          <Spinner />
        </div>
      )}

      {doc.status === "failed" && (
        <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-xl space-y-1">
          <p className="text-red-700 font-medium text-sm">Analysis failed</p>
          <p className="text-red-600 text-sm">
            {doc.error_message?.toLowerCase().includes("rate limit") ||
            doc.error_message?.includes("429") ||
            doc.error_message?.toLowerCase().includes("quota")
              ? "The AI service is temporarily busy (rate limit on the free tier). Please wait a minute or two and try uploading again."
              : `Something went wrong${doc.error_message ? `: ${doc.error_message}` : "."} Please try uploading again.`}
          </p>
          <p className="text-xs text-red-400 pt-1">Delete this document and re-upload once the issue resolves.</p>
        </div>
      )}

      {doc.status === "done" && doc.analysis && (
        <div className="mt-4 space-y-8">
          <div className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-500">Overall risk</span>
                <RiskBadge risk={doc.analysis.overall_risk} />
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{doc.analysis.summary}</p>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              Clause breakdown
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({doc.analysis.clauses.length} clause{doc.analysis.clauses.length === 1 ? "" : "s"})
              </span>
            </h2>
            <div className="space-y-3">
              {doc.analysis.clauses.map((c, i) => (
                <ClauseCard key={i} clause={c} />
              ))}
            </div>
          </div>

          {doc.analysis.negotiation_tips.length > 0 && (
            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1.5L2 4.5V9C2 12.3 4.7 15.2 8 16.3C11.3 15.2 14 12.3 14 9V4.5L8 1.5Z" stroke="#4F46E5" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M5.5 8.5L7 10L10.5 6.5" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                What you could negotiate
              </h2>
              <ul className="space-y-2">
                {doc.analysis.negotiation_tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-indigo-500 mt-0.5">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ChatBox documentId={doc.id} />
        </div>
      )}
    </div>
  );
}
