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
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
