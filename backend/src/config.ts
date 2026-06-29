import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `환경변수 ${name}가 비어 있습니다. backend/.env.example을 참고해 backend/.env에 값을 채워주세요.`
    );
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  openaiApiKey: () => required("OPENAI_API_KEY"),
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  voyageApiKey: () => required("VOYAGE_API_KEY"),
  voyageModel: process.env.VOYAGE_MODEL ?? "voyage-multilingual-2",
  supabaseUrl: () => required("SUPABASE_URL"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  similarityThreshold: Number(process.env.SIMILARITY_THRESHOLD ?? 0.35),
  matchCount: Number(process.env.MATCH_COUNT ?? 5),
};
