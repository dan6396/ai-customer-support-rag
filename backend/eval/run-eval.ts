/**
 * 한국어 RAG 리트리벌 품질 평가 하니스.
 *
 * 무엇을 측정하나:
 *  - 정답 질문(answerable): 기대한 주제의 청크가 threshold 이상으로 검색되는가 (recall)
 *  - 무관 질문(unanswerable): threshold를 넘는 청크가 없어 "모른다"로 막히는가 (정확 거부)
 *
 * 설계:
 *  - DB 없이 in-process에서 코사인 유사도 계산 (리트리벌 로직만 격리 측정, 재현 가능)
 *  - 임베딩은 배치 호출 + 디스크 캐시 → Voyage 레이트리밋 우회, 재실행 즉시
 *  - 여러 threshold를 한 번에 스윕 → 0.35가 최적인지 데이터로 확인
 *
 * 실행: backend 디렉터리에서  npx tsx eval/run-eval.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { embedDocuments, embedQueries } from "../src/lib/embeddings.js";
import { expandQuery } from "../src/lib/llm.js";
import { chunkPlainText } from "../src/lib/chunking.js";

const evalDir = dirname(fileURLToPath(import.meta.url));
const cacheDir = join(evalDir, ".cache");
const cacheFile = join(cacheDir, "emb.json");
const expandCacheFile = join(cacheDir, "expansions.json");

type Gold = {
  question: string;
  answerable: boolean;
  expectedHeading?: string;
  expectedFact?: string;
};

// ---------- 임베딩 캐시 ----------
function loadCache(): Record<string, number[]> {
  if (!existsSync(cacheFile)) return {};
  return JSON.parse(readFileSync(cacheFile, "utf-8"));
}
function saveCache(cache: Record<string, number[]>) {
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(cache));
}
function keyOf(inputType: string, text: string): string {
  return inputType + ":" + createHash("sha1").update(text).digest("hex");
}

async function embedCached(
  texts: string[],
  inputType: "document" | "query"
): Promise<number[][]> {
  const cache = loadCache();
  const missing: string[] = [];
  for (const t of texts) {
    if (!cache[keyOf(inputType, t)]) missing.push(t);
  }
  if (missing.length > 0) {
    console.log(`  Voyage 호출: ${inputType} ${missing.length}건 (캐시 미스)`);
    const vecs =
      inputType === "document"
        ? await embedDocuments(missing)
        : await embedQueries(missing);
    missing.forEach((t, i) => (cache[keyOf(inputType, t)] = vecs[i]));
    saveCache(cache);
  }
  return texts.map((t) => cache[keyOf(inputType, t)]);
}

// ---------- 질문 확장 캐시 ----------
async function expandCached(questions: string[]): Promise<string[]> {
  const cache: Record<string, string> = existsSync(expandCacheFile)
    ? JSON.parse(readFileSync(expandCacheFile, "utf-8"))
    : {};
  let misses = 0;
  for (const q of questions) {
    if (!cache[q]) {
      cache[q] = await expandQuery(q);
      misses++;
    }
  }
  if (misses > 0) {
    if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
    writeFileSync(expandCacheFile, JSON.stringify(cache, null, 2));
    console.log(`  GPT 확장 호출: ${misses}건 (캐시 미스)`);
  }
  return questions.map((q) => cache[q]);
}

// ---------- 코사인 유사도 ----------
function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function main() {
  // 1) 코퍼스 청킹
  const corpus = readFileSync(join(evalDir, "corpus", "academy.txt"), "utf-8");
  const chunks = chunkPlainText(corpus);
  const headings = chunks.map((c) => c.split("\n")[0].trim());
  console.log(`코퍼스: ${chunks.length}개 청크`);
  console.log(`  주제: ${headings.join(" / ")}\n`);

  // 2) 골드셋
  const gold: Gold[] = JSON.parse(
    readFileSync(join(evalDir, "goldset.json"), "utf-8")
  );
  const answerable = gold.filter((g) => g.answerable);
  const unanswerable = gold.filter((g) => !g.answerable);
  console.log(
    `골드셋: ${gold.length}문항 (정답 가능 ${answerable.length} / 무관 ${unanswerable.length})\n`
  );

  // 3) 임베딩 (배치 + 캐시)
  const chunkEmb = await embedCached(chunks, "document");
  const qEmb = await embedCached(
    gold.map((g) => g.question),
    "query"
  );

  // 3b) 질문 확장 + 확장본 임베딩
  const expanded = await expandCached(gold.map((g) => g.question));
  const qExpEmb = await embedCached(expanded, "query");

  // 청크별 유사도 벡터 계산기
  const simsFor = (qVec: number[]) =>
    chunkEmb.map((ce, ci) => ({ heading: headings[ci], sim: cosine(qVec, ce) }));

  // 변형별 per-question 청크 유사도
  type Sim = { heading: string; sim: number };
  const variants: Record<string, Sim[][]> = {
    "원본": gold.map((_, qi) => simsFor(qEmb[qi])),
    "확장본": gold.map((_, qi) => simsFor(qExpEmb[qi])),
    "max-pool": gold.map((_, qi) => {
      const o = simsFor(qEmb[qi]);
      const e = simsFor(qExpEmb[qi]);
      return o.map((s, ci) => ({
        heading: s.heading,
        sim: Math.max(s.sim, e[ci].sim),
      }));
    }),
  };

  const topSim = (s: Sim[]) => Math.max(...s.map((x) => x.sim));
  function evaluate(perQ: Sim[][], t: number) {
    let inOk = 0;
    let outOk = 0;
    for (let qi = 0; qi < gold.length; qi++) {
      const g = gold[qi];
      if (g.answerable) {
        if (perQ[qi].some((s) => s.sim >= t && s.heading === g.expectedHeading))
          inOk++;
      } else if (topSim(perQ[qi]) < t) {
        outOk++;
      }
    }
    return { inOk, outOk, overall: ((inOk + outOk) / gold.length) * 100 };
  }

  // 4) 변형 비교 (threshold 0.35 고정)
  const T = 0.35;
  console.log(`── 변형 비교 (threshold ${T}) ──`);
  console.log("변형      | 정답검색(recall) | 무관거부 | 종합정확도");
  for (const name of ["원본", "확장본", "max-pool"]) {
    const r = evaluate(variants[name], T);
    console.log(
      `${name.padEnd(8)} |   ${r.inOk}/${answerable.length} (${(
        (r.inOk / answerable.length) *
        100
      ).toFixed(0)}%)      |  ${r.outOk}/${unanswerable.length}    |  ${r.overall.toFixed(
        0
      )}%`
    );
  }

  // 5) 확장이 살려낸 질문 (원본에서 놓쳤다가 max-pool에서 잡힌 것)
  console.log(`\n── 확장으로 살려낸 문항 (threshold ${T}) ──`);
  let rescued = 0;
  for (let qi = 0; qi < gold.length; qi++) {
    const g = gold[qi];
    if (!g.answerable) continue;
    const origHit = variants["원본"][qi].some(
      (s) => s.sim >= T && s.heading === g.expectedHeading
    );
    const maxHit = variants["max-pool"][qi].some(
      (s) => s.sim >= T && s.heading === g.expectedHeading
    );
    if (!origHit && maxHit) {
      rescued++;
      console.log(`  [살림] "${g.question}"  →  "${expanded[qi]}"`);
    }
  }
  if (rescued === 0) console.log("  없음");

  // 6) max-pool threshold 스윕 (재최적화)
  console.log("\n── max-pool threshold 스윕 ──");
  console.log("thresh | 정답검색(recall) | 무관거부 | 종합정확도");
  for (const t of [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5]) {
    const r = evaluate(variants["max-pool"], t);
    console.log(
      `${t.toFixed(2)}   |   ${r.inOk}/${answerable.length} (${(
        (r.inOk / answerable.length) *
        100
      ).toFixed(0)}%)      |  ${r.outOk}/${unanswerable.length}    |  ${r.overall.toFixed(
        0
      )}%`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
