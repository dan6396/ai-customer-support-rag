-- Supabase SQL editor에서 그대로 실행하세요.
-- voyage-multilingual-2 임베딩은 1024차원입니다.

create extension if not exists vector;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text, -- 'upload' | 'url' | 'manual'
  created_at timestamptz not null default now()
);

create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  content text not null,
  embedding vector(1024) not null,
  created_at timestamptz not null default now()
);

-- 코사인 유사도 검색용 인덱스
create index if not exists chunks_embedding_idx
  on chunks using hnsw (embedding vector_cosine_ops);

-- 유사도 검색 RPC: 질문 임베딩과 가장 가까운 청크 top-k 반환
create or replace function match_chunks(
  query_embedding vector(1024),
  match_count int default 5,
  similarity_threshold float default 0.5
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    chunks.id,
    chunks.document_id,
    chunks.content,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where 1 - (chunks.embedding <=> query_embedding) > similarity_threshold
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
