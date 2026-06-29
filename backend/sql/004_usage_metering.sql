-- Supabase SQL editor에서 그대로 실행하세요 (003_tenants_widget.sql 실행 후).
-- 월별 사용량(질문 처리 건수) 추적. 정액제의 "비용 폭탄 없음" 약속을
-- 실체화하기 위한 최소 미터링: 한도 도달 시 차단하지 않고 경고만 한다.

alter table tenants
  add column if not exists usage_count int not null default 0,
  add column if not exists usage_period text not null default to_char(now(), 'YYYY-MM');
