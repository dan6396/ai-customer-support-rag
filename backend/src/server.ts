import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { ingestRouter } from "./routes/ingest.js";
import { chatRouter } from "./routes/chat.js";
import { widgetRouter } from "./routes/widget.js";
import { tenantRouter } from "./routes/tenant.js";

const app = express();

// 위젯이 학원마다 다른 도메인에 임베드되므로 CORS는 전면 개방.
app.use(cors());
// req.ip가 프록시 뒤에서도 실제 클라이언트 IP를 가리키도록 (위젯 레이트리밋용).
app.set("trust proxy", true);
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", ingestRouter);
app.use("/api", chatRouter);
app.use("/api", tenantRouter);
app.use("/api", widgetRouter);

app.listen(config.port, () => {
  console.log(`단답 백엔드가 http://localhost:${config.port} 에서 실행 중입니다.`);
});
