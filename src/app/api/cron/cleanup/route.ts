import { createAdminClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get("authorization");
  if (process.env.NODE_ENV === "production") {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const supabase = createAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase 설정이 누락되었습니다." },
      { status: 500 },
    );
  }

  // 2일 전 날짜 계산
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  try {
    // 2일 이상 된 방 데이터 삭제
    // ON DELETE CASCADE 설정으로 인해 연결된 플레이리스트 레코드도 자동으로 삭제됨
    const { count, error } = await supabase
      .from("rooms")
      .delete({ count: "exact" })
      .lt("created_at", twoDaysAgo.toISOString());

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deletedCount: count,
      message: `${twoDaysAgo.toISOString()} 이전의 방 데이터를 정리했습니다.`,
    });
  } catch (error: any) {
    console.error("데이터 정리 크론 오류:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
