"use client";

import { motion } from "framer-motion";

const links = ["기능", "가격", "고객사례", "블로그"];

export default function Nav() {
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-4 inset-x-0 z-50 flex justify-center px-4"
    >
      <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-md">
        <span className="font-display text-lg font-bold px-3 flex items-center gap-2">
          <span className="inline-block h-4 w-4 rotate-12 bg-accent rounded-sm" />
          단답
        </span>
        <ul className="hidden md:flex items-center gap-1 text-sm text-white/70">
          {links.map((l) => (
            <li key={l}>
              <a
                href={`#${l}`}
                className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors"
              >
                {l}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#login"
              className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-colors"
            >
              로그인
            </a>
          </li>
        </ul>
        <a
          href="#demo"
          className="ml-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-black hover:brightness-110 transition"
        >
          무료로 시작하기
        </a>
      </nav>
    </motion.header>
  );
}
