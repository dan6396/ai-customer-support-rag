"use client";

import { motion } from "framer-motion";

const PLANS = [
  {
    name: "Free",
    price: "₩0",
    unit: "",
    desc: "체험용",
    limit: "월 100건",
    features: ["웹 위젯", "지식소스 1개", "카드등록 불필요"],
    cta: "무료 시작",
    highlight: false,
  },
  {
    name: "Basic",
    price: "₩29,000",
    unit: "/월",
    desc: "소상공인",
    limit: "월 1,000건",
    features: ["웹 + 카톡 1개", "사람 상담원 연결", "기본 분석"],
    cta: "시작하기",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₩79,000",
    unit: "/월",
    desc: "성장 SME",
    limit: "월 5,000건",
    features: ["웹+카톡+네이버", "문서 버전관리", "답변 품질평가", "브랜딩 제거"],
    cta: "시작하기",
    highlight: true,
  },
  {
    name: "Business",
    price: "₩199,000",
    unit: "/월",
    desc: "중소기업",
    limit: "월 20,000건",
    features: ["전 채널", "다중 상담원", "PII·보안", "우선 지원"],
    cta: "문의하기",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="가격" className="py-28 px-6 bg-panel">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <h2 className="font-display text-4xl md:text-5xl font-extrabold">
            매달 얼마 나올지 아는 챗봇.
          </h2>
          <p className="mt-4 text-white/50">
            해결당 과금 없음 · 한도 초과 시 자동 청구 ❌ · 동의 없이 1원도 안
            나갑니다.
          </p>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={
                "rounded-2xl border p-7 flex flex-col " +
                (p.highlight
                  ? "border-accent bg-accent/[0.06] relative"
                  : "border-white/10 bg-white/[0.02]")
              }
            >
              {p.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-xs font-bold text-black">
                  인기
                </span>
              )}
              <div className="text-sm text-white/50">{p.desc}</div>
              <div className="font-display text-2xl font-bold mt-1">{p.name}</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{p.price}</span>
                <span className="text-white/40 text-sm">{p.unit}</span>
              </div>
              <div className="mt-2 text-sm text-accent">{p.limit}</div>
              <ul className="mt-6 space-y-2 text-sm text-white/60 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-accent">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#demo"
                className={
                  "mt-7 rounded-full px-4 py-2.5 text-sm font-medium text-center transition " +
                  (p.highlight
                    ? "bg-accent text-black hover:brightness-110"
                    : "border border-white/15 text-white/80 hover:bg-white/5")
                }
              >
                {p.cta}
              </a>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-white/40">
          연결제 시 2개월 무료 · 한도 초과 시 추가팩(₩10,000 / 500건) 직접 구매
        </p>
      </div>
    </section>
  );
}
