import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import * as api from "../api/client";
import type { DocumentItem } from "../api/client";
import DisclaimerBanner from "../components/DisclaimerBanner";
import RiskBadge from "../components/RiskBadge";
import ClauseCard from "../components/ClauseCard";
import ChatBox from "../components/ChatBox";

export default function DocumentResult() {
  const { id } = useParams();
  const documentId = Number(id);
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

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
      const d = await api.getDocument(documentId);
      if (active) setDoc(d);
      if (active && (d.status === "pending" || d.status === "processing")) {
        setTimeout(load, 3000);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [documentId]);

  if (!doc) return <p className="text-center mt-12 text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4 pb-12">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="text-sm text-blue-600">
          &larr; Back to documents
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 border border-red-200 hover:border-red-400 rounded-md px-3 py-1.5"
        >
          {deleting ? "Deleting…" : "Delete document"}
        </button>
      </div>
      <h1 className="text-2xl font-semibold mt-2 mb-4">{doc.filename}</h1>
      <DisclaimerBanner />

      {(doc.status === "pending" || doc.status === "processing") && (
        <p className="text-gray-600">Analyzing your document, this usually takes under a minute...</p>
      )}

      {doc.status === "failed" && (
        <div className="text-red-600 space-y-1">
          <p>
            {doc.error_message?.toLowerCase().includes("rate limit") ||
            doc.error_message?.includes("429") ||
            doc.error_message?.toLowerCase().includes("quota")
              ? "The AI service is temporarily busy (rate limit reached on the free tier). Please wait a minute or two and try uploading again."
              : `Something went wrong analyzing this document${doc.error_message ? `: ${doc.error_message}` : "."} Please try uploading again.`}
          </p>
          <p className="text-sm text-red-500">You can delete this document and re-upload it once the issue is resolved.</p>
        </div>
      )}

      {doc.status === "done" && doc.analysis && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-medium">Overall risk:</span>
            <RiskBadge risk={doc.analysis.overall_risk} />
          </div>
          <p className="text-gray-800 mb-6">{doc.analysis.summary}</p>

          <h2 className="text-lg font-medium mb-2">Clause breakdown</h2>
          {doc.analysis.clauses.map((c, i) => (
            <ClauseCard key={i} clause={c} />
          ))}

          {doc.analysis.negotiation_tips.length > 0 && (
            <div className="mt-6 mb-6">
              <h2 className="text-lg font-medium mb-2">What you could negotiate</h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-800">
                {doc.analysis.negotiation_tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <ChatBox documentId={doc.id} />
        </>
      )}
    </div>
  );
}
