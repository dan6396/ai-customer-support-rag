# 단답 (Dandap) — 한국어 RAG 고객지원 챗봇 SaaS

한국 학원·소상공인(SME)을 위한 **월 정액제 AI 고객지원 챗봇**. 업로드한 정책 문서(PDF·DOCX)를 근거로만 답하고, 모르면 "모른다"고 답하도록 설계해 환각을 억제합니다.

> 한 줄 아이디어를 AI 멀티에이전트 시장조사로 검증하고, 기획부터 백엔드·프론트엔드 구현까지 이어간 포트폴리오 프로젝트입니다. 자세한 기획·검증 과정은 [`AI활용_포트폴리오_사업기획.md`](AI활용_포트폴리오_사업기획.md) 참고.

## 핵심 차별화

경쟁사(채널톡·인터콤·Zendesk 등) 리뷰 불만을 기반으로 설계한 포지셔닝:

| 경쟁사 불만 | 단답의 해결책 |
|---|---|
| 종량 과금 → 비용 폭탄 | **월 정액제** + 사용량 미터링 |
| 한국어 답변 품질·환각 | **한국어 임베딩 + "모르면 모른다" 강제** + 유사도 임계값 가드 |
| 셋업 복잡·영어 지원 | **5분 노코드 위젯 임베드** (스크립트 한 줄) |

## 저장소 구조

```
.
├── backend/              # Express + TypeScript RAG API 서버
│   ├── src/
│   │   ├── lib/          # RAG 코어 (청킹·임베딩·검색·LLM 답변)
│   │   ├── routes/       # ingest / chat / widget / tenant 엔드포인트
│   │   └── middleware/   # 인증 · 레이트리밋
│   ├── sql/              # Supabase 스키마 (pgvector, 멀티테넌트, 미터링)
│   └── eval/             # RAG 정확도 자체 평가 (goldset 기반)
├── landing/              # Next.js 랜딩페이지 + 대시보드 + 임베드 위젯
├── sample-docs/          # 테스트용 학원 정책 문서
└── portfolio-diagrams/   # 아키텍처·RAG 파이프라인 다이어그램
```

## 기술 스택

- **백엔드**: Node.js, Express 5, TypeScript
- **RAG**: Voyage AI(`voyage-multilingual-2`) 임베딩, OpenAI(`gpt-4o-mini`) 답변 생성
- **DB**: Supabase (Postgres + pgvector)
- **프론트엔드**: Next.js, React, Tailwind CSS
- **문서 파싱**: mammoth(DOCX), pdf-parse(PDF)

## RAG 파이프라인 특징

질문을 격식체로 확장한 뒤 **원본 + 확장본을 함께 임베딩·검색해 max-pool로 병합**합니다. 한국어 구어체/문어체 어휘 갭으로 인한 리트리벌 누락을 줄이는 기법으로, 자체 평가셋 기준 recall이 **86% → 100%** 로 개선됐습니다. (자세한 내용: [`backend/eval/RESULTS.md`](backend/eval/RESULTS.md))

## 로컬 실행

### 백엔드

```bash
cd backend
npm install
cp .env.example .env   # API 키 채우기 (OpenAI · Voyage · Supabase)
# sql/*.sql 을 Supabase SQL 에디터에서 순서대로 실행
npm run dev            # http://localhost:8787
```

### 프론트엔드

```bash
cd landing
npm install
npm run dev            # http://localhost:3000
```

## 라이선스

개인 포트폴리오용 프로젝트입니다.
