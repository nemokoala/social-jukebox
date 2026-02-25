"use server";

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

interface YouTubeSearchItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      default?: { url: string };
      high?: { url: string };
    };
  };
}

export async function searchYouTubeVideos(
  query: string,
): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API Key is missing");
  }

  const url = new URL(YOUTUBE_SEARCH_URL);
  url.searchParams.append("part", "snippet");
  url.searchParams.append("q", query);
  url.searchParams.append("type", "video");
  url.searchParams.append("videoCategoryId", "10"); // Music category
  url.searchParams.append("maxResults", "10");
  url.searchParams.append("key", YOUTUBE_API_KEY);

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`YouTube API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return data.items.map((item: YouTubeSearchItem) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      // Decode HTML entities in title (YouTube API returns encoded titles occasionally)
      thumbnail:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch (error) {
    console.error("YouTube search error:", error);
    return [];
  }
}
