import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 일반 클라이언트 (브라우저/클라이언트용, RLS 적용됨)
export const supabase = createClient(supabaseUrl, supabaseKey);

// 서버 전용 어드민 클라이언트 생성 함수 (데이터 삭제 등 관리자 작업용)
export const createAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
