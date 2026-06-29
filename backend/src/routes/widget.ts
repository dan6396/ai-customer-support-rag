import { Router } from "express";
import { z } from "zod";
import { getTenantByWidgetKey } from "../lib/supabase.js";
import { answerQuestion } from "../lib/rag.js";
import { rateLimit } from "../middleware/rateLimit.js";

/**
 * 공개 위젯 엔드포인트 (인증 없음).
 * 학원 홈페이지에 심긴 위젯이 widget_key로 호출한다.
 * 키 → owner_id 해석 후 해당 학원 문서 범위로만 답한다.
 */
export const widgetRouter = Router();

const ChatSchema = z.object({
  question: z.string().min(1).max(1000),
});

// 위젯 렌더링용 공개 설정(학원명·인사말). owner_id는 노출하지 않는다.
widgetRouter.get("/widget/:widgetKey/config", rateLimit(60), async (req, res) => {
  try {
    const tenant = await getTenantByWidgetKey(String(req.params.widgetKey));
    if (!tenant) {
      return res.status(404).json({ error: "위젯을 찾을 수 없습니다." });
    }
    res.json({ businessName: tenant.business_name, greeting: tenant.greeting });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

widgetRouter.post("/widget/:widgetKey/chat", rateLimit(20), async (req, res) => {
  const parsed = ChatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const tenant = await getTenantByWidgetKey(String(req.params.widgetKey));
    if (!tenant) {
      return res.status(404).json({ error: "위젯을 찾을 수 없습니다." });
    }

    const result = await answerQuestion(parsed.data.question, tenant.owner_id);
    // 공개 응답에는 내부 출처 메타데이터(chunkId 등)를 노출하지 않는다.
    res.json({ answer: result.answer, grounded: result.grounded });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
