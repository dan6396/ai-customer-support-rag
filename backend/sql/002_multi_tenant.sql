-- Supabase SQL editor에서 그대로 실행하세요 (001_init.sql 실행 후).
-- 사업자(계정)별로 문서를 분리하기 위한 마이그레이션.

-- 테스트용으로 넣었던 문서는 특정 계정 소유가 아니므로 정리합니다.
delete from chunks;
delete from documents;

alter table documents
  add column if not exists owner_id uuid not null references auth.users(id) on delete cascade;

create index if not exists documents_owner_id_idx on documents (owner_id);

-- owner_id로도 필터링하도록 검색 함수 교체
create or replace function match_chunks(
  query_embedding vector(1024),
  owner_id uuid,
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
  join documents on documents.id = chunks.document_id
  where documents.owner_id = match_chunks.owner_id
    and 1 - (chunks.embedding <=> query_embedding) > similarity_threshold
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
