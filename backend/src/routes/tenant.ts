import { Router } from "express";
import { z } from "zod";
import { getOrCreateTenant, updateTenant, displayUsage } from "../lib/supabase.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

/**
 * 원장(인증된 사용자)의 위젯 설정 관리.
 * 대시보드에서 widget_key 확인 + 학원명/인사말 수정 + 이번 달 사용량 조회에 사용.
 */
export const tenantRouter = Router();

tenantRouter.get("/tenant", requireAuth, async (req, res) => {
  const ownerId = (req as AuthedRequest).userId;
  try {
    const tenant = await getOrCreateTenant(ownerId);
    res.json({
      widgetKey: tenant.widget_key,
      businessName: tenant.business_name,
      greeting: tenant.greeting,
      usage: displayUsage(tenant),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

const UpdateSchema = z.object({
  businessName: z.string().min(1).max(60).optional(),
  greeting: z.string().min(1).max(300).optional(),
});

tenantRouter.patch("/tenant", requireAuth, async (req, res) => {
  const ownerId = (req as AuthedRequest).userId;
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    // 행이 없을 수 있으므로 먼저 보장
    await getOrCreateTenant(ownerId);
    const tenant = await updateTenant(ownerId, {
      business_name: parsed.data.businessName,
      greeting: parsed.data.greeting,
    });
    res.json({
      widgetKey: tenant.widget_key,
      businessName: tenant.business_name,
      greeting: tenant.greeting,
      usage: displayUsage(tenant),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
