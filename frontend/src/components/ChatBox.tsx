import { useEffect, useRef, useState } from "react";
import * as api from "../api/client";
import type { ChatMessage } from "../api/client";

export default function ChatBox({ documentId }: { documentId: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getChatHistory(documentId).then(setMessages).catch(() => {});
  }, [documentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const question = input.trim();
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: question, created_at: new Date().toISOString() }]);
    try {
      const reply = await api.sendChatMessage(documentId, question);
      setMessages((prev) => [...prev, reply]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <h3 className="font-medium mb-3">Ask a follow-up question</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm p-2 rounded-lg max-w-[85%] ${
              m.role === "user" ? "bg-blue-50 ml-auto text-right" : "bg-gray-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="e.g. Can my landlord keep my full deposit?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
