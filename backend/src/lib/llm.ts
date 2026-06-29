import OpenAI from "openai";
import { config } from "../config.js";
import type { MatchedChunk } from "./supabase.js";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: config.openaiApiKey() });
  }
  return client;
}

const NO_EVIDENCE_ANSWER =
  "죄송하지만 해당 내용은 제가 가진 자료에 없어 정확히 안내드리기 어렵습니다. 담당자에게 연결해 드릴까요?";

const EXPAND_PROMPT = `너는 학원 고객 문의를 검색에 맞게 다듬는 역할이다.
사용자의 구어체 질문을, 학원 정책 문서에 나올 법한 격식 있는 표현으로 바꿔 한 문장으로 다시 써라.
규칙:
- 구어체·은어를 문어체 핵심 키워드로 치환한다. 예) "깎아주다"→"할인", "책값"→"교재비", "문 여나요"→"운영 시간".
- 질문에 없는 새로운 정보나 사실을 지어내지 마라.
- 다시 쓴 질문 문장만 출력한다. 설명·따옴표 없이.`;

/**
 * 구어체 질문을 문서 어휘에 가깝게 재작성한다 (query expansion).
 * 한국어 구어체/문어체 어휘 갭으로 인한 리트리벌 누락을 줄이기 위함.
 */
export async function expandQuery(question: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: config.openaiModel,
    max_completion_tokens: 100,
    messages: [
      { role: "system", content: EXPAND_PROMPT },
      { role: "user", content: question },
    ],
  });
  const rewritten = response.choices[0]?.message?.content?.trim();
  return rewritten && rewritten.length > 0 ? rewritten : question;
}

const SYSTEM_PROMPT = `당신은 한국 소상공인의 고객 응대를 돕는 AI 상담원입니다.

규칙:
1. 아래 제공되는 "참고 문서"에 있는 내용만 근거로 답하세요. 문서에 없는 내용은 절대 지어내지 마세요.
2. 참고 문서로 답할 수 없으면, 정확히 이렇게만 답하세요: "${NO_EVIDENCE_ANSWER}"
3. 항상 정중한 존댓말을 사용하세요.
4. 답변은 간결하게, 필요한 정보만 전달하세요.`;

export interface AnswerResult {
  answer: string;
  grounded: boolean;
  sources: { chunkId: string; documentId: string; similarity: number }[];
}

export async function answerFromChunks(
  question: string,
  chunks: MatchedChunk[]
): Promise<AnswerResult> {
  if (chunks.length === 0) {
    return { answer: NO_EVIDENCE_ANSWER, grounded: false, sources: [] };
  }

  const context = chunks
    .map((c, i) => `[참고 문서 ${i + 1}]\n${c.content}`)
    .join("\n\n");

  const response = await getClient().chat.completions.create({
    model: config.openaiModel,
    max_completion_tokens: 512,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `참고 문서:\n${context}\n\n고객 질문: ${question}`,
      },
    ],
  });

  const answer = response.choices[0]?.message?.content?.trim() ?? NO_EVIDENCE_ANSWER;
  const grounded = answer !== NO_EVIDENCE_ANSWER;

  return {
    answer,
    grounded,
    sources: grounded
      ? chunks.map((c) => ({
          chunkId: c.id,
          documentId: c.document_id,
          similarity: c.similarity,
        }))
      : [],
  };
}
