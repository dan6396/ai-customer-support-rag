import type { NextFunction, Request, Response } from "express";
import { getSupabase } from "../lib/supabase.js";

export interface AuthedRequest extends Request {
  userId: string;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  const { data, error } = await getSupabase().auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "유효하지 않은 인증 정보입니다." });
  }

  (req as AuthedRequest).userId = data.user.id;
  next();
}
