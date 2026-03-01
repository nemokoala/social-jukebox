/**
 * YouTube URL에서 video ID를 추출합니다.
 * 지원 형식:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://youtube.com/shorts/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.replace("www.", "");

    if (hostname === "youtu.be") {
      return parsed.pathname.slice(1) || null;
    }

    if (hostname === "youtube.com") {
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.replace("/shorts/", "") || null;
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.replace("/embed/", "") || null;
      }
      return parsed.searchParams.get("v");
    }

    return null;
  } catch {
    return null;
  }
}
