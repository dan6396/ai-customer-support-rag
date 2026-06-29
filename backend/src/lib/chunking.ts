/**
 * 일반 텍스트는 문단 단위로, 표/CSV는 행(row)을 헤더와 함께 묶어서 청킹한다.
 * 헤더-행 분리는 한국어 RAG 실패의 대표 원인 중 하나라 별도 처리한다.
 */

const MAX_CHUNK_CHARS = 800;

/**
 * "수강료 안내", "환불 규정" 같은 짧은 제목 줄을 감지한다.
 * 한국어 정책 문서는 제목(명사구) + 본문 구조가 흔한데, 이를 분리하지 않고
 * 한 청크에 다 뭉치면 특정 주제 질문의 유사도가 희석된다(한국어 RAG 실패의 대표 원인).
 * 제목으로 새 섹션을 시작해 주제별로 청크를 나눈다.
 */
function isHeading(paragraph: string): boolean {
  if (paragraph.length > 30) return false;
  if (paragraph.includes("\n")) return false;
  // 문장 종결(마침표/물음표/느낌표, 한국어 종결어미)로 끝나면 본문 문장이지 제목이 아니다.
  if (/[.!?]$/.test(paragraph)) return false;
  if (/(다|요|죠|음|함|까|네)$/.test(paragraph)) return false;
  return true;
}

export function chunkPlainText(text: string): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  function flush() {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  }

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const startsNewSection =
      isHeading(paragraph) && i + 1 < paragraphs.length && !isHeading(paragraphs[i + 1]);
    const tooLong = (current + "\n\n" + paragraph).length > MAX_CHUNK_CHARS;

    // 제목을 만나면(다음 줄이 본문이면) 새 섹션 시작.
    if ((startsNewSection || tooLong) && current) {
      flush();
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  flush();

  return chunks;
}

/**
 * CSV 문자열을 받아 각 행을 "헤더: 값" 형태의 자연어 청크로 변환한다.
 * 예) "환불 가능 기간,환불 비율\n30일,100%" ->
 *     "환불 가능 기간: 30일\n환불 비율: 100%"
 */
export function chunkCsv(csv: string): string[] {
  const rows = csv
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean);
  if (rows.length < 2) return [];

  const headers = splitCsvRow(rows[0]);
  const chunks: string[] = [];

  for (const row of rows.slice(1)) {
    const cells = splitCsvRow(row);
    const lines = headers.map((h, i) => `${h}: ${cells[i] ?? ""}`);
    chunks.push(lines.join("\n"));
  }

  return chunks;
}

function splitCsvRow(row: string): string[] {
  return row.split(",").map((cell) => cell.trim());
}
