import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { embedDocuments } from "../lib/embeddings.js";
import { chunkCsv, chunkPlainText } from "../lib/chunking.js";
import { extractText } from "../lib/extractText.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const ingestRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const IngestSchema = z.object({
  title: z.string().min(1),
  format: z.enum(["text", "csv"]),
  content: z.string().min(1),
});

ingestRouter.post("/ingest", requireAuth, upload.single("file"), async (req, res) => {
  const ownerId = (req as AuthedRequest).userId;
  const file = req.file;

  let title: string;
  let chunks: string[];

  try {
    if (file) {
      const bodyTitle = typeof req.body.title === "string" ? req.body.title.trim() : "";
      title = bodyTitle || file.originalname;
      const text = await extractText(file.buffer, file.mimetype, file.originalname);
      chunks = chunkPlainText(text);
    } else {
      const parsed = IngestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      title = parsed.data.title;
      chunks =
        parsed.data.format === "csv"
          ? chunkCsv(parsed.data.content)
          : chunkPlainText(parsed.data.content);
    }
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }

  if (chunks.length === 0) {
    return res.status(400).json({ error: "문서에서 내용을 추출하지 못했습니다." });
  }

  try {
    const supabase = getSupabase();

    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({ title, source: "upload", owner_id: ownerId })
      .select("id")
      .single();

    if (docError || !document) {
      throw new Error(docError?.message ?? "문서 생성 실패");
    }

    const embeddings = await embedDocuments(chunks);

    const rows = chunks.map((chunk, i) => ({
      document_id: document.id,
      content: chunk,
      embedding: embeddings[i],
    }));

    const { error: chunkError } = await supabase.from("chunks").insert(rows);
    if (chunkError) {
      throw new Error(chunkError.message);
    }

    res.json({ documentId: document.id, chunkCount: chunks.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
