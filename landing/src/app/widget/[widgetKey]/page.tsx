"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Msg = { role: "user" | "bot"; text: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

// 학원 학부모가 흔히 묻는 질문 — 무엇을 물어야 할지 알려주는 칩.
const SUGGESTIONS = [
  "수강료가 어떻게 되나요?",
  "셔틀버스 노선이 궁금해요",
  "중간에 그만두면 환불되나요?",
];

export default function WidgetPanel() {
  const params = useParams();
  const widgetKey = String(params.widgetKey);

  const [businessName, setBusinessName] = useState("우리 학원");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [loadedConfig, setLoadedConfig] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/widget/${widgetKey}/config`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setBusinessName(data.businessName ?? "우리 학원");
        setMessages([{ role: "bot", text: data.greeting }]);
      })
      .catch(() => {
        setMessages([
          { role: "bot", text: "안녕하세요! 궁금한 점을 물어보세요 😊" },
        ]);
      })
      .finally(() => setLoadedConfig(true));
  }, [widgetKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, asking]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || asking) return;
    setMessages((v) => [...v, { role: "user", text: q }]);
    setQuestion("");
    setAsking(true);
    try {
      const res = await fetch(`${API_URL}/api/widget/${widgetKey}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      const answer =
        typeof data.answer === "string"
          ? data.answer
          : data.error ?? "잠시 후 다시 시도해주세요.";
      setMessages((v) => [...v, { role: "bot", text: answer }]);
    } catch {
      setMessages((v) => [
        ...v,
        { role: "bot", text: "서버에 연결할 수 없습니다." },
      ]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a] text-white">
      {/* 헤더 */}
      <header className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-black font-bold">
          단
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">{businessName}</p>
          <p className="text-xs text-white/40">AI 상담 · 보통 즉시 응답</p>
        </div>
      </header>

      {/* 메시지 */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <span
              className={
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed " +
                (m.role === "user"
                  ? "bg-accent text-black rounded-br-sm"
                  : "bg-white/10 text-white/90 rounded-bl-sm")
              }
            >
              {m.text}
            </span>
          </div>
        ))}
        {asking && (
          <div className="flex justify-start">
            <span className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm text-white/40">
              답변 생성 중…
            </span>
          </div>
        )}

        {/* 첫 화면 추천 질문 */}
        {loadedConfig && messages.length <= 1 && !asking && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 입력 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex items-center gap-2 border-t border-white/10 bg-black/40 px-3 py-3"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="궁금한 점을 입력하세요"
          className="flex-1 rounded-full bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/10"
        />
        <button
          type="submit"
          disabled={!question.trim() || asking}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-black transition hover:opacity-90 disabled:opacity-40"
        >
          ↑
        </button>
      </form>

      <p className="bg-black/40 pb-2 text-center text-[10px] text-white/25">
        단답으로 구동 · 문서에 없는 내용은 답하지 않습니다
      </p>
    </div>
  );
}
