import { VoyageAIClient } from "voyageai";
import { config } from "../config.js";

let client: VoyageAIClient | null = null;

function getClient(): VoyageAIClient {
  if (!client) {
    client = new VoyageAIClient({ apiKey: config.voyageApiKey() });
  }
  return client;
}

/**
 * Voyage는 검색용(query)과 저장용(document) 임베딩을 다른 inputType으로 만들면
 * 검색 정확도가 올라간다 (비대칭 검색 최적화).
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const response = await getClient().embed({
    input: texts,
    model: config.voyageModel,
    inputType: "document",
  });
  return extractEmbeddings(response, texts.length);
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embedQueries([text]);
  return embedding;
}

/** 여러 질문을 한 번의 요청으로 임베딩한다 (평가 시 레이트리밋 절약). */
export async function embedQueries(texts: string[]): Promise<number[][]> {
  const response = await getClient().embed({
    input: texts,
    model: config.voyageModel,
    inputType: "query",
  });
  return extractEmbeddings(response, texts.length);
}

function extractEmbeddings(
  response: { data?: { embedding?: number[] }[] },
  expectedCount: number
): number[][] {
  const items = response.data ?? [];
  const embeddings = items.map((item) => item.embedding ?? []);
  if (embeddings.length !== expectedCount) {
    throw new Error(
      `임베딩 응답 개수(${embeddings.length})가 요청 개수(${expectedCount})와 다릅니다.`
    );
  }
  return embeddings;
}
