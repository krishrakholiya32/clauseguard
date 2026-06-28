import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;
const client = axios.create({
  baseURL: apiUrl !== undefined ? apiUrl : "http://localhost:8000",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export interface Clause {
  text: string;
  plain_english: string;
  risk: "green" | "yellow" | "red";
  reason: string;
}

export interface Analysis {
  summary: string;
  overall_risk: "green" | "yellow" | "red";
  clauses: Clause[];
  negotiation_tips: string[];
}

export interface DocumentItem {
  id: number;
  filename: string;
  doc_type: string;
  status: "pending" | "processing" | "done" | "failed";
  error_message: string | null;
  created_at: string;
  analysis: Analysis | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function signup(email: string, password: string) {
  const { data } = await client.post("/auth/signup", { email, password });
  return data.access_token as string;
}

export async function login(email: string, password: string) {
  const { data } = await client.post("/auth/login", { email, password });
  return data.access_token as string;
}

export async function uploadDocument(file: File, docType: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("doc_type", docType);
  const { data } = await client.post<DocumentItem>("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listDocuments() {
  const { data } = await client.get<DocumentItem[]>("/documents");
  return data;
}

export async function getDocument(id: number) {
  const { data } = await client.get<DocumentItem>(`/documents/${id}`);
  return data;
}

export async function deleteDocument(id: number) {
  await client.delete(`/documents/${id}`);
}

export async function getChatHistory(id: number) {
  const { data } = await client.get<ChatMessage[]>(`/documents/${id}/chat`);
  return data;
}

export async function sendChatMessage(id: number, message: string) {
  const { data } = await client.post<ChatMessage>(`/documents/${id}/chat`, { message });
  return data;
}

export default client;
