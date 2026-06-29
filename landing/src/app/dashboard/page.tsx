"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Msg = { role: "user" | "bot"; text: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [widgetKey, setWidgetKey] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [savingTenant, setSavingTenant] = useState(false);
  const [tenantStatus, setTenantStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<{ count: number; limit: number } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
        return;
      }
      setEmail(data.session.user.email ?? null);
      setChecking(false);
      loadTenant(data.session.access_token);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function authHeader() {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token}` };
  }

  async function loadTenant(token: string) {
    try {
      const res = await fetch(`${API_URL}/api/tenant`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setWidgetKey(data.widgetKey);
        setBusinessName(data.businessName);
        setGreeting(data.greeting);
        setUsage(data.usage ?? null);
      }
    } catch {
      /* 위젯 설정 로드 실패는 조용히 무시 */
    }
  }

  async function handleSaveTenant(e: React.FormEvent) {
    e.preventDefault();
    setSavingTenant(true);
    setTenantStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/tenant`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ businessName, greeting }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setBusinessName(data.businessName);
      setGreeting(data.greeting);
      setUsage(data.usage ?? null);
      setTenantStatus("저장되었습니다.");
    } catch (err) {
      setTenantStatus((err as Error).message);
    } finally {
      setSavingTenant(false);
    }
  }

  const embedSnippet = widgetKey
    ? `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js" data-key="${widgetKey}"></script>`
    : "";

  async function copyEmbed() {
    await navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploadStatus(null);
    setUploading(true);
    try {
      const formData = new FormData();
      if (title) formData.append("title", title);
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/ingest`, {
        method: "POST",
        headers: await authHeader(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "업로드 실패");
      setUploadStatus(`등록 완료 (청크 ${data.chunkCount}개)`);
      setTitle("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadStatus((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || asking) return;
    setMessages((v) => [...v, { role: "user", text: q }]);
    setQuestion("");
    setAsking(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      const answer = typeof data.answer === "string" ? data.answer : data.error ?? "오류가 발생했습니다.";
      setMessages((v) => [...v, { role: "bot", text: answer }]);
    } catch {
      setMessages((v) => [...v, { role: "bot", text: "서버에 연결할 수 없습니다." }]);
    } finally {
      setAsking(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-panel text-white/50">
        확인 중…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-panel px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">대시보드</h1>
            <p className="mt-1 text-sm text-white/50">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            로그아웃
          </button>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {/* 문서 업로드 */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <h2 className="font-display text-lg font-semibold text-white">정책 문서 등록</h2>
            <form onSubmit={handleUpload} className="mt-4 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="문서 제목 (선택, 비워두면 파일명 사용)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-accent"
              />
              <input
                ref={fileInputRef}
                required
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 outline-none focus:border-accent file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-white/80"
              />
              <p className="text-xs text-white/40">PDF, Word(.docx)만 지원합니다. 한글(.hwp)은 PDF나 Word로 변환 후 업로드해주세요.</p>
              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full rounded-full bg-white px-6 py-3 font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                {uploading ? "등록 중…" : "등록하기"}
              </button>
              {uploadStatus && <p className="text-sm text-white/60">{uploadStatus}</p>}
            </form>
          </section>

          {/* 내 챗봇 테스트 */}
          <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
            <h2 className="font-display text-lg font-semibold text-white">내 챗봇 테스트</h2>
            <div className="mt-4 flex h-[360px] flex-col justify-end rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex-1 space-y-3 overflow-y-auto">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <span
                      className={
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed " +
                        (m.role === "user"
                          ? "bg-accent text-black rounded-br-sm"
                          : "bg-white/10 text-white/90 rounded-bl-sm")
                      }
                    >
                      {m.text}
                    </span>
                  </div>
                ))}
                {asking && <p className="text-sm text-white/40">답변 생성 중…</p>}
              </div>
              <form onSubmit={handleAsk} className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2.5">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="내가 등록한 문서로 질문해보세요"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || asking}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20 disabled:opacity-40"
                >
                  ↑
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* 위젯 설치 */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-6">
          <h2 className="font-display text-lg font-semibold text-white">홈페이지에 챗봇 설치</h2>
          <p className="mt-1 text-sm text-white/50">
            아래 한 줄을 학원 홈페이지의 &lt;/body&gt; 앞에 붙여넣으면 우측 하단에 상담 챗봇이 나타납니다.
          </p>

          {usage && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>이번 달 사용량</span>
                <span>
                  {usage.count.toLocaleString()} / {usage.limit.toLocaleString()}건
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={
                    "h-full rounded-full transition-all " +
                    (usage.count >= usage.limit ? "bg-red-400" : "bg-accent")
                  }
                  style={{ width: `${Math.min(100, (usage.count / usage.limit) * 100)}%` }}
                />
              </div>
              {usage.count >= usage.limit && (
                <p className="mt-1.5 text-xs text-red-400">
                  이번 달 권장 사용량을 초과했습니다. 서비스는 계속 정상 이용 가능합니다.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {/* 임베드 코드 */}
            <div>
              <label className="text-xs font-medium text-white/40">임베드 코드</label>
              <div className="mt-2 rounded-xl border border-white/10 bg-black/50 p-3">
                <code className="block break-all text-xs text-accent">
                  {embedSnippet || "위젯 키를 불러오는 중…"}
                </code>
              </div>
              <button
                onClick={copyEmbed}
                disabled={!embedSnippet}
                className="mt-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-40"
              >
                {copied ? "복사됨 ✓" : "코드 복사"}
              </button>
              {widgetKey && (
                <a
                  href={`/widget/${widgetKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 text-sm text-white/40 underline hover:text-white/70"
                >
                  미리보기
                </a>
              )}
            </div>

            {/* 학원명 / 인사말 설정 */}
            <form onSubmit={handleSaveTenant} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-white/40">학원 이름</label>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="예: 한빛수학학원"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40">첫 인사말</label>
                <textarea
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  rows={3}
                  placeholder="안녕하세요! 수강료·시간표·환불 등 궁금한 점을 물어보세요 😊"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-accent"
                />
              </div>
              <button
                type="submit"
                disabled={savingTenant}
                className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                {savingTenant ? "저장 중…" : "설정 저장"}
              </button>
              {tenantStatus && <p className="text-sm text-white/60">{tenantStatus}</p>}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
