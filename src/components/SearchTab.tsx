"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { searchYouTubeVideos, YouTubeVideo } from "@/app/actions/youtube";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SearchTabProps {
  roomId: string;
  onSuccess: () => void;
}

export function SearchTab({ roomId, onSuccess }: SearchTabProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isAddingId, setIsAddingId] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      const videos = await searchYouTubeVideos(query);
      setResults(videos);
    });
  };

  const handleAddVideo = async (video: YouTubeVideo) => {
    setIsAddingId(video.id);
    try {
      const { error } = await supabase.from("playlist").insert([
        {
          room_id: roomId,
          video_id: video.id,
          title: video.title,
          thumbnail_url: video.thumbnail,
        },
      ]);

      if (error) throw error;

      toast.success("곡이 플레이리스트에 추가되었습니다!");
      onSuccess();
    } catch (error) {
      console.error("Error adding video:", error);
      toast.error("곡 추가에 실패했습니다.");
    } finally {
      setIsAddingId(null);
    }
  };

  return (
    <>
      <form onSubmit={handleSearch} className="flex space-x-2">
        <Input
          placeholder="음악을 검색하세요..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={isPending || !query.trim()}>
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          검색
        </Button>
      </form>

      <div className="flex-1 overflow-y-auto mt-2 space-y-4">
        {results.length === 0 && !isPending && query && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            검색 결과가 없습니다.
          </p>
        )}

        {results.map((video) => (
          <div
            key={video.id}
            className="flex items-center space-x-4 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="relative w-24 h-16 shrink-0 rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={video.thumbnail}
                alt={video.title}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium line-clamp-2"
                dangerouslySetInnerHTML={{ __html: video.title }}
              />
              <p className="text-xs text-muted-foreground truncate">
                {video.channelTitle}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAddVideo(video)}
              disabled={isAddingId === video.id}
            >
              {isAddingId === video.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "추가"
              )}
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
