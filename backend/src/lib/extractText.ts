import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

/**
 * 업로드된 파일(PDF/Word)에서 순수 텍스트를 추출한다.
 * 한글(.hwp)은 오픈소스로 안정적으로 파싱할 방법이 없어 의도적으로 지원하지 않는다.
 */
export async function extractText(
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop() ?? "";

  if (ext === "pdf" || mimetype === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText({ pageJoiner: "" });
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (
    ext === "docx" ||
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === "hwp" || ext === "hwpx") {
    throw new Error(
      "한글(.hwp) 파일은 지원하지 않습니다. PDF나 Word(.docx)로 다른 이름으로 저장한 뒤 업로드해주세요."
    );
  }

  throw new Error("지원하지 않는 파일 형식입니다. PDF 또는 Word(.docx) 파일만 업로드할 수 있습니다.");
}
