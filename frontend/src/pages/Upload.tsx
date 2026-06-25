import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../api/client";
import DisclaimerBanner from "../components/DisclaimerBanner";

const DOC_TYPES = [
  { value: "rental", label: "Rental agreement" },
  { value: "employment", label: "Employment contract" },
  { value: "loan", label: "Loan agreement" },
  { value: "freelance", label: "Freelance / service agreement" },
  { value: "nda", label: "NDA" },
  { value: "sale", label: "Sale / purchase agreement" },
  { value: "insurance", label: "Insurance policy" },
  { value: "other", label: "Other" },
];

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("rental");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
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

  return (
    <div className="max-w-lg mx-auto mt-12 px-4">
      <h1 className="text-2xl font-semibold mb-4">Upload a document</h1>
      <DisclaimerBanner />
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
        >
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          type="file"
          accept=".pdf,.docx,.png,.jpg,.jpeg"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          className="w-full bg-blue-600 text-white rounded-lg py-2 disabled:opacity-50"
          type="submit"
          disabled={uploading || !file}
        >
          {uploading ? "Uploading..." : "Analyze document"}
        </button>
      </form>
    </div>
  );
}
