import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api/client";
import type { DocumentItem } from "../api/client";
import RiskBadge from "../components/RiskBadge";

const STATUS_LABELS: Record<string, string> = {
  pending: "Queued",
  processing: "Analyzing...",
  done: "Ready",
  failed: "Failed",
};

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
    <div className="max-w-2xl mx-auto mt-12 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your documents</h1>
        <Link to="/upload" className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm">
          + Upload new
        </Link>
      </div>
      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && documents.length === 0 && (
        <p className="text-gray-500">No documents yet. Upload one to get started.</p>
      )}
      <div className="space-y-3">
        {documents.map((doc) => (
          <Link
            key={doc.id}
            to={`/documents/${doc.id}`}
            className="block border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{doc.filename}</p>
                <p className="text-sm text-gray-500 capitalize">{doc.doc_type}</p>
              </div>
              <div className="flex items-center gap-2">
                {doc.analysis && <RiskBadge risk={doc.analysis.overall_risk} />}
                <span className="text-sm text-gray-500">{STATUS_LABELS[doc.status]}</span>
                <button
                  onClick={(e) => handleDelete(e, doc.id)}
                  disabled={deletingId === doc.id}
                  className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 border border-red-200 hover:border-red-400 rounded px-2 py-0.5 whitespace-nowrap"
                  title="Delete document"
                >
                  {deletingId === doc.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
