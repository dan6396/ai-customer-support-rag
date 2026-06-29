import { matchChunks, incrementUsage, type MatchedChunk } from "./supabase.js";
import { embedQueries } from "./embeddings.js";
import { expandQuery, answerFromChunks, type AnswerResult } from "./llm.js";
import { config } from "../config.js";

/**
 * 질문을 받아 특정 학원(ownerId) 문서 범위로만 답한다.
 * 인증 채팅(/api/chat)과 공개 위젯(/api/widget/:key/chat)이 공유하는 핵심 경로.
 *
 * 한국어 구어체/문어체 어휘 갭으로 인한 리트리벌 누락을 줄이기 위해
 * 질문을 격식체로 확장한 뒤, 원본과 확장본 검색 결과를 max-pool로 병합한다.
 * (평가셋 기준 recall 86% → 100%. eval/RESULTS.md 참고.)
 */
export async function answerQuestion(
  question: string,
  ownerId: string
): Promise<AnswerResult> {
  // 사용량 집계는 채팅 핵심 기능에 영향을 주지 않도록 실패해도 무시한다.
  incrementUsage(ownerId).catch((err) => {
    console.error("사용량 집계 실패:", err);
  });

  const expanded = await expandQuery(question);

  // 원본 + 확장본을 한 번의 요청으로 임베딩
  const [origEmb, expEmb] = await embedQueries([question, expanded]);

  // 각각 검색 후 병합 (chunk id 기준 더 높은 유사도 채택)
  const [a, b] = await Promise.all([
    matchChunks(origEmb, ownerId),
    matchChunks(expEmb, ownerId),
  ]);

  const byId = new Map<string, MatchedChunk>();
  for (const c of [...a, ...b]) {
    const prev = byId.get(c.id);
    if (!prev || c.similarity > prev.similarity) byId.set(c.id, c);
  }
  const merged = [...byId.values()]
    .sort((x, y) => y.similarity - x.similarity)
    .slice(0, config.matchCount);

  // 답변 생성에는 사용자의 원래 질문을 그대로 전달한다.
  return answerFromChunks(question, merged);
}
