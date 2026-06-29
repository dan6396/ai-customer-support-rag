"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "₩",
    title: "비용 폭탄 없는 정액제",
    body: "해결당 과금 없음. 한도에 닿으면 자동 청구 대신 알림만. 매달 똑같은 금액, 예측 가능합니다.",
  },
  {
    icon: "✓",
    title: "한국어 환각 억제",
    body: "내 문서만 근거로 답하고, 출처를 표시합니다. 자료에 없으면 ‘모른다’고 정직하게 말합니다.",
  },
  {
    icon: "⚡",
    title: "5분 노코드 셋업",
    body: "스마트스토어·홈페이지 FAQ를 붙여넣기만 하면 끝. 엑셀 FAQ 표도 깨지지 않게 학습합니다.",
  },
  {
    icon: "💬",
    title: "카톡·네이버 네이티브",
    body: "글로벌 툴이 약한 카카오톡 채널, 네이버 톡톡을 기본 지원. 고객이 쓰는 채널에서 응대합니다.",
  },
];

export default function Features() {
  return (
    <section id="기능" className="py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl md:text-5xl font-extrabold mb-16 max-w-2xl"
        >
          경쟁사가 한국어로 못 하는 것만 합니다.
        </motion.h2>

        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group rounded-2xl border border-white/10 bg-white/[0.02] p-8 hover:border-accent/40 hover:bg-white/[0.04] transition-colors"
            >
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent text-xl font-bold">
                {f.icon}
              </div>
              <h3 className="font-display text-2xl font-bold mb-3">{f.title}</h3>
              <p className="text-white/55 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
