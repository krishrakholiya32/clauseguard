import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as api from "../api/client";

const DOC_TYPES = [
  { value: "rental", label: "Rental agreement" },
  { value: "employment", label: "Employment contract" },
  { value: "loan", label: "Loan agreement" },
  { value: "freelance", label: "Freelance / service agreement" },
  { value: "nda", label: "NDA" },
  { value: "sale", label: "Sale / purchase agreement" },
  { value: "insurance", label: "Insurance policy" },
  { value: "partnership", label: "Partnership / joint venture" },
  { value: "vendor", label: "Vendor / supplier agreement" },
  { value: "consulting", label: "Consulting / advisory agreement" },
  { value: "software", label: "Software license agreement" },
  { value: "other", label: "Other" },
];

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path
        d="M20 10.667H22.667a2.667 2.667 0 012.666 2.666v10.667a2.667 2.667 0 01-2.666 2.667H9.333a2.667 2.667 0 01-2.666-2.667V13.333a2.667 2.667 0 012.666-2.666H12"
        stroke="#4F46E5"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 5.333v13.334M12 9.333l4-4 4 4"
        stroke="#4F46E5"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("rental");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const doc = await api.uploadDocument(file, docType);
      navigate(`/documents/${doc.id}`);
    } catch {
      setError("Upload failed. Please try a different file (PDF, DOCX, JPG, or PNG).");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Back to documents
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Analyze a contract</h1>
        <p className="text-gray-500 text-sm">
          Upload your document and get an AI-powered clause breakdown in under a minute.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contract type</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Document</label>
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragOver
                ? "border-indigo-400 bg-indigo-50"
                : file
                ? "border-indigo-300 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300 bg-gray-50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            <div className="flex justify-center mb-3">
              <UploadIcon />
            </div>
            {file ? (
              <>
                <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">
                  Drop your file here, or <span className="text-indigo-600">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, JPG, PNG — up to 10 MB</p>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        <button
          className="w-full bg-indigo-600 text-white font-semibold rounded-xl py-3 text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm"
          type="submit"
          disabled={uploading || !file}
        >
          {uploading ? "Uploading…" : "Analyze document"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Analysis usually takes 30–60 seconds. Results are private to your account.
        </p>
      </form>
    </div>
  );
}
