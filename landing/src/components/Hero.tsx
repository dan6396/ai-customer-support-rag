"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "bot"; text: string };

const SCRIPT: Msg[] = [
  { role: "user", text: "연간 요금제 중간에 취소하면 환불되나요?" },
  {
    role: "bot",
    text: "네, 연간 요금제는 남은 기간을 월 단위로 일할 환불해 드립니다. 환불 신청은 마이페이지 > 결제내역에서 가능하고, 영업일 기준 3일 내 처리됩니다. 📄 근거: 환불정책 2조",
  },
  { role: "user", text: "그럼 혹시 우주여행 패키지도 파나요?" },
  {
    role: "bot",
    text: "죄송하지만 해당 내용은 제가 가진 자료에 없어 정확히 안내드리기 어렵습니다. 담당자에게 연결해 드릴까요?",
  },
];

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const demoY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      while (!cancelled) {
        setMessages([]);
        for (const msg of SCRIPT) {
          if (cancelled) return;
          if (msg.role === "bot") {
            setTyping(true);
            await wait(900);
            setTyping(false);
          } else {
            await wait(500);
          }
          if (cancelled) return;
          setMessages((v) => [...v, msg]);
          await wait(msg.role === "bot" ? 2600 : 700);
        }
        await wait(1800);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-screen bg-panel pt-32 pb-20 px-6 overflow-hidden"
    >
      <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: live chat demo */}
        <motion.div style={{ y: demoY }} className="order-2 lg:order-1">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-sm min-h-[360px] flex flex-col justify-end">
            <div className="space-y-3">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={
                    m.role === "user" ? "flex justify-end" : "flex justify-start"
                  }
                >
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
                </motion.div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <span className="flex gap-1 rounded-2xl bg-white/10 px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-white/60"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: d * 0.2,
                        }}
                      />
                    ))}
                  </span>
                </div>
              )}
            </div>
            <a
              href="/login"
              className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
            >
              <span className="text-accent">✦</span>
              <span className="text-sm text-white/40">
                내 문서로 직접 테스트해보려면 회원가입…
              </span>
              <span className="ml-auto grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/60">
                ↑
              </span>
            </a>
          </div>
        </motion.div>

        {/* Right: headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="order-1 lg:order-2"
        >
          <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-[1.1]">
            고객이 원하는 건
            <br />
            변명이 아니라
            <br />
            <span className="text-accent">명확한 답 입니다.</span>
          </h1>
          <div className="mt-6 space-y-4 text-white/60 text-lg max-w-md">
            <p>
              고객이 챗봇에 물으면, 대부분의 AI는 그럴듯하게 지어냅니다. 영어
              기준으로 만들어졌으니까요.
            </p>
            <p className="text-white/80">
              <span className="font-display font-bold text-white">단답</span>은
              당신의 문서만 근거로 답합니다. 모르면 모른다고 합니다.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#demo"
              className="rounded-full bg-white px-6 py-3 font-medium text-black hover:bg-white/90 transition"
            >
              무료로 시작하기
            </a>
            <a
              href="#가격"
              className="rounded-full border border-white/20 px-6 py-3 font-medium text-white/80 hover:bg-white/5 transition"
            >
              가격 보기
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
