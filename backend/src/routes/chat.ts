import { Router } from "express";
import { z } from "zod";
import { answerQuestion } from "../lib/rag.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const chatRouter = Router();

const ChatSchema = z.object({
  question: z.string().min(1),
});

chatRouter.post("/chat", requireAuth, async (req, res) => {
  const parsed = ChatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const ownerId = (req as AuthedRequest).userId;

  try {
    const result = await answerQuestion(parsed.data.question, ownerId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
