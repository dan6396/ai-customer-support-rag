"use client";

import { motion } from "framer-motion";

const STEPS = [
  { year: "2000년대", label: "FAQ 게시판. 고객은 못 찾음.", offset: "mt-0" },
  { year: "2018년", label: "룰베이스 챗봇. 정해진 답만.", offset: "mt-10" },
  {
    year: "2023년",
    label: "글로벌 AI 챗봇. 한국어로 헛소리.",
    offset: "mt-20",
  },
  { year: "지금", label: "단답. 한국어로, 정확하게.", offset: "mt-28", highlight: true },
];

export default function Timeline() {
  return (
    <section className="bg-[#f4f4f4] py-20 px-4">
      <div className="mx-auto max-w-6xl rounded-[2rem] bg-[#0a0a0a] p-8 md:p-16">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl md:text-5xl font-extrabold leading-tight"
        >
          20년의 고객 응대.
          <br />
          20년의 땜질.
        </motion.h2>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 relative">
          {STEPS.map((step, i) => (
            <div key={step.year} className="relative">
              <div className="text-xs text-white/40 mb-3">{step.year}</div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.25 }}
                className={
                  step.offset +
                  " rounded-xl px-4 py-3 text-sm font-medium " +
                  (step.highlight
                    ? "bg-accent text-black"
                    : "bg-white/10 text-white/90")
                }
              >
                {step.label}
              </motion.div>
            </div>
          ))}
        </div>

        <div className="mt-24 grid md:grid-cols-2 gap-10 border-t border-white/10 pt-12">
          <div>
            <div className="text-xs tracking-widest text-white/40 mb-3">
              내 사이트 안에서
            </div>
            <h3 className="font-display text-2xl font-bold mb-3">
              최고의 상담원을 FAQ 페이지로 바꿔버렸습니다.
            </h3>
            <p className="text-white/50">
              대화가 목록이 되고, 추천이 필터가 됐습니다. 응대의 전문성은
              사라졌습니다.
            </p>
          </div>
          <div>
            <div className="text-xs tracking-widest text-white/40 mb-3">
              내 사이트 밖에서
            </div>
            <h3 className="font-display text-2xl font-bold mb-3">
              이제 ChatGPT가 내 고객에게 답하고 있습니다.
            </h3>
            <p className="text-white/50">
              고객은 일반 AI에 우리 제품을 묻습니다. AI는 추측하고, 헛소리하고,
              경쟁사를 추천합니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
