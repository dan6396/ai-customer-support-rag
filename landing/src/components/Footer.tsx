"use client";

import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer id="demo" className="px-6 py-28 border-t border-white/10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-3xl text-center"
      >
        <h2 className="font-display text-4xl md:text-6xl font-extrabold leading-tight">
          오늘 FAQ를 붙여넣으면,
          <br />
          내일 고객이 답을 받습니다.
        </h2>
        <p className="mt-6 text-white/50 text-lg">
          설치 5분. 카드 등록 없이 무료로 시작하세요.
        </p>
        <a
          href="#"
          className="mt-10 inline-block rounded-full bg-accent px-8 py-4 font-medium text-black hover:brightness-110 transition"
        >
          무료로 시작하기
        </a>
      </motion.div>

      <div className="mx-auto max-w-6xl mt-24 flex flex-col md:flex-row justify-between gap-6 text-sm text-white/40">
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rotate-12 bg-accent rounded-sm" />
          <span className="font-display font-bold text-white/70">단답</span>
          <span>— 한국어 고객 응대 AI</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition">
            이용약관
          </a>
          <a href="#" className="hover:text-white transition">
            개인정보처리방침
          </a>
          <a href="#" className="hover:text-white transition">
            문의
          </a>
        </div>
      </div>
    </footer>
  );
}
