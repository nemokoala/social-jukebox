"use server";

import { extractYouTubeVideoId } from "@/lib/youtube-utils";

// Invidious 퍼블릭 인스턴스 목록
const INVIDIOUS_INSTANCES = ["https://iv.melmac.space"];

// 공식 YouTube Data API (Invidious 전부 실패 시 fallback)
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

/**
 * YouTube oEmbed API(무료)를 사용하여 영상 정보를 가져옵니다.
 */
export async function getYouTubeVideoByUrl(
  url: string,
): Promise<YouTubeVideo | null> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oEmbedUrl, { next: { revalidate: 3600 } });

    if (!response.ok) {
      // 비공개 영상이거나 존재하지 않는 경우
      return null;
    }

    const data = await response.json();

    return {
      id: videoId,
      title: data.title ?? "Unknown Title",
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      channelTitle: data.author_name ?? "",
    };
  } catch (error) {
    console.error("YouTube oEmbed error:", error);
    return null;
  }
}

// Invidious API 응답 타입
interface InvidiousSearchItem {
  type: string;
  videoId: string;
  title: string;
  author: string;
  videoThumbnails: { quality: string; url: string }[];
}

/**
 * Invidious API(무료, API Key 불필요)로 YouTube 영상을 검색합니다.
 * 여러 퍼블릭 인스턴스를 순서대로 시도해 하나가 실패해도 자동으로 다음 인스턴스를 사용합니다.
 */
export async function searchYouTubeVideos(
  query: string,
): Promise<YouTubeVideo[]> {
  const params = new URLSearchParams({
    q: query,
    type: "video",
    fields: "type,videoId,title,author,videoThumbnails",
  });

  for (const instance of INVIDIOUS_INSTANCES) {
    console.log(`[Invidious] 시도 중: ${instance}`);
    try {
      const response = await fetch(
        `${instance}/api/v1/search?${params.toString()}`,
        { next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) },
      );

      if (!response.ok) {
        console.warn(`[Invidious] ❌ HTTP ${response.status} — ${instance}`);
        continue;
      }

      const data: InvidiousSearchItem[] = await response.json();
      console.log(`[Invidious] ✅ 성공: ${instance} (결과 ${data.length}개)`);

      return data
        .filter((item) => item.type === "video")
        .slice(0, 10)
        .map((item) => {
          // 화질 우선순위: high → medium → default → 첫 번째
          const thumb =
            item.videoThumbnails.find((t) => t.quality === "high")?.url ||
            item.videoThumbnails.find((t) => t.quality === "medium")?.url ||
            item.videoThumbnails.find((t) => t.quality === "default")?.url ||
            `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;

          return {
            id: item.videoId,
            title: item.title,
            thumbnail: thumb,
            channelTitle: item.author,
          };
        });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[Invidious] ❌ 연결 실패: ${instance} — ${msg}`);
      // 다음 인스턴스로 계속
    }
  }

  console.warn("[Invidious] 모든 인스턴스 실패 → 공식 YouTube API로 fallback");

  // ── 공식 YouTube Data API fallback ──
  if (!YOUTUBE_API_KEY) {
    console.error("[YouTube] API Key가 없어 fallback 불가");
    return [];
  }

  try {
    const url = new URL(YOUTUBE_SEARCH_URL);
    url.searchParams.append("part", "snippet");
    url.searchParams.append("q", query);
    url.searchParams.append("type", "video");
    url.searchParams.append("maxResults", "10");
    url.searchParams.append("key", YOUTUBE_API_KEY);

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`[YouTube] ❌ HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(
      `[YouTube] ✅ 공식 API 성공 (결과 ${data.items?.length ?? 0}개)`,
    );

    return (
      data.items?.map(
        (item: {
          id: { videoId: string };
          snippet: {
            title: string;
            channelTitle: string;
            thumbnails: { high?: { url: string }; default?: { url: string } };
          };
        }) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.default?.url ||
            "",
          channelTitle: item.snippet.channelTitle,
        }),
      ) ?? []
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[YouTube] ❌ 공식 API 실패 — ${msg}`);
    return [];
  }
}
