-- Supabase SQL editor에서 그대로 실행하세요 (002_multi_tenant.sql 실행 후).
-- 학원(사업자)별 공개 위젯 설정을 담는 테이블.
-- widget_key: 학원 홈페이지에 심는 공개 키. 이 키로만 해당 학원 범위의 챗봇이 호출된다.
-- (이 테이블은 추후 정액제 사용량 미터링/캡의 집이 된다.)

create table if not exists tenants (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  widget_key text not null unique default replace(gen_random_uuid()::text, '-', ''),
  business_name text not null default '우리 학원',
  greeting text not null default '안녕하세요! 수강료·시간표·환불 등 궁금한 점을 물어보세요 😊',
  created_at timestamptz not null default now()
);

create index if not exists tenants_widget_key_idx on tenants (widget_key);
