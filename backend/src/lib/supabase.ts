import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          title: string;
          source: string | null;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          source?: string | null;
          owner_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
        Relationships: [];
      };
      chunks: {
        Row: {
          id: string;
          document_id: string;
          content: string;
          embedding: number[];
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          content: string;
          embedding: number[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chunks"]["Insert"]>;
        Relationships: [];
      };
      tenants: {
        Row: {
          owner_id: string;
          widget_key: string;
          business_name: string;
          greeting: string;
          usage_count: number;
          usage_period: string;
          created_at: string;
        };
        Insert: {
          owner_id: string;
          widget_key?: string;
          business_name?: string;
          greeting?: string;
          usage_count?: number;
          usage_period?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_chunks: {
        Args: {
          query_embedding: number[];
          owner_id: string;
          match_count: number;
          similarity_threshold: number;
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

let client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabase() {
  if (!client) {
    client = createClient<Database>(config.supabaseUrl(), config.supabaseServiceRoleKey());
  }
  return client;
}

export interface MatchedChunk {
  id: string;
  document_id: string;
  content: string;
  similarity: number;
}

export async function matchChunks(
  queryEmbedding: number[],
  ownerId: string,
  matchCount = config.matchCount,
  similarityThreshold = config.similarityThreshold
): Promise<MatchedChunk[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    owner_id: ownerId,
    match_count: matchCount,
    similarity_threshold: similarityThreshold,
  });

  if (error) {
    throw new Error(`벡터 검색 실패: ${error.message}`);
  }

  return (data ?? []) as MatchedChunk[];
}

export interface Tenant {
  owner_id: string;
  widget_key: string;
  business_name: string;
  greeting: string;
  usage_count: number;
  usage_period: string;
}

export const MONTHLY_USAGE_LIMIT = 2000;

/** 현재 사용량 집계 기간 키 ("YYYY-MM"). */
export function currentUsagePeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * 화면에 보여줄 사용량. 저장된 usage_period가 지난 달이면(아직 리셋 전이어도)
 * 이번 달은 0건으로 보여준다 — 실제 리셋은 다음 채팅 호출 시 일어난다.
 */
export function displayUsage(tenant: Tenant): { count: number; limit: number } {
  const count = tenant.usage_period === currentUsagePeriod() ? tenant.usage_count : 0;
  return { count, limit: MONTHLY_USAGE_LIMIT };
}

const TENANT_COLUMNS = "owner_id, widget_key, business_name, greeting, usage_count, usage_period";

/**
 * 원장 계정의 테넌트(위젯 설정) 행을 가져온다. 없으면 기본값으로 새로 만든다.
 * 대시보드 첫 진입 시 호출되어 widget_key를 발급한다.
 */
export async function getOrCreateTenant(ownerId: string): Promise<Tenant> {
  const supabase = getSupabase();

  const { data: existing, error: selectError } = await supabase
    .from("tenants")
    .select(TENANT_COLUMNS)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (selectError) {
    throw new Error(`테넌트 조회 실패: ${selectError.message}`);
  }
  if (existing) {
    return existing as Tenant;
  }

  const { data: created, error: insertError } = await supabase
    .from("tenants")
    .insert({ owner_id: ownerId })
    .select(TENANT_COLUMNS)
    .single();

  if (insertError || !created) {
    throw new Error(insertError?.message ?? "테넌트 생성 실패");
  }
  return created as Tenant;
}

/** 공개 위젯 키로 테넌트를 찾는다. 위젯 엔드포인트가 owner_id를 알아내는 통로. */
export async function getTenantByWidgetKey(widgetKey: string): Promise<Tenant | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tenants")
    .select(TENANT_COLUMNS)
    .eq("widget_key", widgetKey)
    .maybeSingle();

  if (error) {
    throw new Error(`위젯 키 조회 실패: ${error.message}`);
  }
  return (data as Tenant) ?? null;
}

/** 원장이 학원명·인사말을 수정한다. */
export async function updateTenant(
  ownerId: string,
  patch: { business_name?: string; greeting?: string }
): Promise<Tenant> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("tenants")
    .update(patch)
    .eq("owner_id", ownerId)
    .select(TENANT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "테넌트 수정 실패");
  }
  return data as Tenant;
}

/**
 * 질문 처리 1건을 사용량에 반영한다. 월이 바뀌면 카운터를 리셋한다.
 * 한도(MONTHLY_USAGE_LIMIT) 초과 시에도 차단하지 않고 overLimit만 알려준다 (경고 전용 정책).
 * 정확한 동시성 보장은 하지 않음 — MVP 단계의 경고용 카운터로 충분하다고 판단.
 */
export async function incrementUsage(
  ownerId: string
): Promise<{ count: number; limit: number; overLimit: boolean }> {
  const supabase = getSupabase();
  const currentPeriod = currentUsagePeriod();

  const { data: tenant, error: selectError } = await supabase
    .from("tenants")
    .select("usage_count, usage_period")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (selectError || !tenant) {
    // 테넌트 행이 없으면(드문 경우) 사용량 기록을 건너뛴다. 채팅 자체는 막지 않는다.
    return { count: 0, limit: MONTHLY_USAGE_LIMIT, overLimit: false };
  }

  const nextCount = tenant.usage_period === currentPeriod ? tenant.usage_count + 1 : 1;

  const { error: updateError } = await supabase
    .from("tenants")
    .update({ usage_count: nextCount, usage_period: currentPeriod })
    .eq("owner_id", ownerId);

  if (updateError) {
    throw new Error(`사용량 갱신 실패: ${updateError.message}`);
  }

  return {
    count: nextCount,
    limit: MONTHLY_USAGE_LIMIT,
    overLimit: nextCount > MONTHLY_USAGE_LIMIT,
  };
}
