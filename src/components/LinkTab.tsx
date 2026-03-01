"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Link, Music } from "lucide-react";
import { getYouTubeVideoByUrl, YouTubeVideo } from "@/app/actions/youtube";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface LinkTabProps {
  roomId: string;
  onSuccess: () => void;
}

export function LinkTab({ roomId, onSuccess }: LinkTabProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPreview, setLinkPreview] = useState<YouTubeVideo | null>(null);
  const [isFetchingLink, startLinkTransition] = useTransition();
  const [isAddingLink, setIsAddingLink] = useState(false);

  const handleFetchLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    setLinkPreview(null);
    startLinkTransition(async () => {
      const video = await getYouTubeVideoByUrl(linkUrl);
      if (!video) {
        toast.error("유효한 YouTube 링크가 아니거나 비공개 영상입니다.");
        return;
      }
      setLinkPreview(video);
    });
  };

  const handleAddLinkVideo = async () => {
    if (!linkPreview) return;
    setIsAddingLink(true);
    try {
      const { error } = await supabase.from("playlist").insert([
        {
          room_id: roomId,
          video_id: linkPreview.id,
          title: linkPreview.title,
          thumbnail_url: linkPreview.thumbnail,
        },
      ]);

      if (error) throw error;

      toast.success("곡이 플레이리스트에 추가되었습니다!");
      onSuccess();
    } catch (error) {
      console.error("Error adding video:", error);
      toast.error("곡 추가에 실패했습니다.");
    } finally {
      setIsAddingLink(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleFetchLink} className="flex space-x-2">
        <Input
          placeholder="YouTube URL을 붙여넣으세요..."
          value={linkUrl}
          onChange={(e) => {
            setLinkUrl(e.target.value);
            setLinkPreview(null);
          }}
        />
        <Button type="submit" disabled={isFetchingLink || !linkUrl.trim()}>
          {isFetchingLink ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "확인"
          )}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground -mt-2">
        youtube.com/watch, youtu.be, Shorts 링크를 지원합니다.
      </p>

      {/* 미리보기 카드 */}
      {linkPreview && (
        <div className="flex items-center space-x-4 p-3 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="relative w-24 h-16 shrink-0 rounded overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={linkPreview.thumbnail}
              alt={linkPreview.title}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-2">
              {linkPreview.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {linkPreview.channelTitle}
            </p>
          </div>
        </div>
      )}

      {linkPreview && (
        <Button
          onClick={handleAddLinkVideo}
          disabled={isAddingLink}
          className="w-full"
        >
          {isAddingLink ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Music className="w-4 h-4 mr-2" />
          )}
          플레이리스트에 추가
        </Button>
      )}

      {!linkPreview && !isFetchingLink && (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
          <Link className="w-8 h-8 opacity-30" />
          <p className="text-sm">YouTube 링크를 입력하고 확인을 누르세요</p>
        </div>
      )}
    </div>
  );
}
