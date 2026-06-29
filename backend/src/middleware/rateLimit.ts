import type { Request, Response, NextFunction } from "express";

/**
 * 공개 위젯 엔드포인트는 인증이 없어 비용 남용(OpenAI/Voyage 호출)에 노출된다.
 * widget_key + IP 단위로 분당 호출 수를 제한하는 간단한 인메모리 슬라이딩 윈도우.
 * (단일 인스턴스 가정. 다중 인스턴스/재시작 내구성이 필요하면 Redis로 교체.)
 */
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export function rateLimit(maxPerMinute: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const scope = req.params.widgetKey ?? "global";
    const key = `${scope}:${req.ip}`;
    const now = Date.now();

    const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= maxPerMinute) {
      return res
        .status(429)
        .json({ error: "요청이 너무 잦습니다. 잠시 후 다시 시도해주세요." });
    }

    recent.push(now);
    hits.set(key, recent);

    // 메모리 누수 방지: 맵이 과도하게 커지면 오래된 빈 키 정리
    if (hits.size > 10_000) {
      for (const [k, v] of hits) {
        if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
      }
    }

    next();
  };
}
