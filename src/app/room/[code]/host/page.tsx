"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import YouTube, { YouTubeEvent } from "react-youtube";
import { notFound, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Copy, Music, Play, Disc3, Radio } from "lucide-react";
import { toast } from "sonner";

interface PlaylistSong {
  id: string;
  video_id: string;
  title: string;
  thumbnail_url: string;
  played_at: string | null;
}

export default function HostRoom({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [code, setCode] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [currentSong, setCurrentSong] = useState<PlaylistSong | null>(null);
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setCode(p.code.toUpperCase()));
  }, [params]);

  // 1. 방 정보 가져오기
  const { data: roomId, error: roomError } = useQuery({
    queryKey: ["room", code],
    queryFn: async () => {
      if (!code) return null;
      const { data: room, error } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (error || !room) {
        throw error;
      }
      return room.id as string;
    },
    enabled: !!code,
  });

  // 2. 재생 목록 가져오기
  const { data: playlist = [], isError: playlistError } = useQuery({
    queryKey: ["playlist", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from("playlist")
        .select("*")
        .eq("room_id", roomId)
        .is("played_at", null)
        .order("added_at", { ascending: true });

      if (error) throw error;
      return data as PlaylistSong[];
    },
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`host_room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "playlist",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["playlist", roomId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  // 에러 핸들링
  useEffect(() => {
    if (roomError) {
      toast.error("방을 찾을 수 없습니다.");
      router.push("/");
    } else if (playlistError) {
      toast.error("재생 목록을 가져올 수 없습니다.");
      router.push("/");
    }
  }, [roomError, playlistError, router]);

  // YouTube 플레이어 이벤트 핸들러에서 최신 상태에 접근하기 위한 ref (클로저 문제 방지)
  const currentSongRef = useRef<PlaylistSong | null>(null);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  // 재생 로직 처리: 현재 재생 중인 곡이 없고 대기열에 곡이 있다면 첫 번째 곡을 재생
  useEffect(() => {
    if (!currentSong && playlist.length > 0) {
      setCurrentSong(playlist[0]);
    }
  }, [playlist, currentSong]);

  // YouTube 플레이어 상태 변경 핸들러
  const handleStateChange = async (event: YouTubeEvent) => {
    console.log("event", event);
    // 0은 동영상 종료(Ended) 상태를 의미합니다.
    if (event.data === 0) {
      const songToEnd = currentSongRef.current;
      if (!songToEnd) return;

      // 이전 곡이 다시 재생되는 것을 막기 위해 캐시에서 즉시 비워줍니다 (낙관적 업데이트)
      queryClient.setQueryData(
        ["playlist", roomId],
        (old: PlaylistSong[] | undefined) => {
          if (!old) return [];
          return old.filter((song) => song.id !== songToEnd.id);
        },
      );

      // 현재 곡을 null로 설정하면 useEffect에 의해 다음 첫 번째 곡이 자연스럽게 재생됩니다.
      setCurrentSong(null);

      // DB에서 현재 곡을 재생 완료 처리
      await supabase
        .from("playlist")
        .update({ played_at: new Date().toISOString() })
        .eq("id", songToEnd.id);

      if (roomId) {
        queryClient.invalidateQueries({ queryKey: ["playlist", roomId] });
      }
    }
  };

  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1, // 로드 시 동영상 자동 재생
      controls: 1,
      modestbranding: 1,
      playsinline: 1, // iOS에서 필수이며 일부 브라우저에서 백그라운드 재생에 도움이 됨
    },
  };

  const handleReady = (event: YouTubeEvent) => {
    // 백그라운드 재생을 강제할 수 있도록 준비가 완료되면 명시적으로 재생을 호출합니다
    event.target.playVideo();
  };

  const copyRoomCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success("Room code copied to clipboard!");
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* 왼쪽 사이드: 플레이어 */}
      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b bg-card/50 backdrop-blur-sm flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Radio className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Host Room</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                Ask friends to join with code:
                <Badge
                  variant="secondary"
                  className="font-mono text-sm px-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={copyRoomCode}
                >
                  {code}{" "}
                  <Copy className="w-3 h-3 ml-2 inline-block opacity-50" />
                </Badge>
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 bg-dot-pattern relative">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />

          {/* YouTube 플레이어 래퍼 */}
          <div className="w-full max-w-5xl z-10 flex flex-col gap-6">
            <Card className="overflow-hidden border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl ring-1 ring-white/10">
              <div className="aspect-video relative bg-background flex items-center justify-center group">
                {!currentSong ? (
                  <div className="text-muted-foreground flex flex-col items-center gap-4 animate-in fade-in duration-1000">
                    <div className="h-24 w-24 rounded-full bg-muted/20 flex items-center justify-center mb-2">
                      <Disc3 className="h-12 w-12 text-muted-foreground animate-spin-slow opacity-50" />
                    </div>
                    <p className="text-lg font-medium">
                      Waiting for the next song...
                    </p>
                    <p className="text-sm text-muted-foreground/60">
                      The queue is currently empty
                    </p>
                  </div>
                ) : (
                  <>
                    <YouTube
                      videoId={currentSong.video_id}
                      opts={opts}
                      onReady={handleReady}
                      onStateChange={handleStateChange}
                      className="absolute inset-0 w-full h-full pointer-events-auto z-10"
                      iframeClassName="w-full h-full border-0 absolute top-0 left-0"
                    />
                    {/* 재생 중인 동영상 뒤의 은은한 발광 효과 */}
                    <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
                  </>
                )}
              </div>

              {currentSong && (
                <div className="p-4 bg-card border-t border-border/50 flex items-center gap-4">
                  <div className="h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Music className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-lg line-clamp-1"
                      dangerouslySetInnerHTML={{ __html: currentSong.title }}
                    />
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      Now Playing
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>

      {/* 오른쪽 사이드: 대기열 사이드바 */}
      <div className="w-[400px] flex flex-col border-l bg-card/30 backdrop-blur-xl">
        <div className="px-6 py-5 border-b bg-card/50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-primary" />
            Up Next
            <Badge
              variant="secondary"
              className="ml-auto rounded-full font-mono"
            >
              {playlist.length} {playlist.length === 1 ? "song" : "songs"}
            </Badge>
          </h2>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-3">
            {playlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 p-6 border border-dashed rounded-xl bg-muted/10">
                <Music className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Queue is empty. <br /> Add songs from your phone!
                </p>
              </div>
            ) : (
              playlist.map((song, index) => {
                const isPlaying = currentSong?.id === song.id;

                return (
                  <Card
                    key={song.id}
                    className={`transition-all duration-300 overflow-hidden relative group
                      ${
                        isPlaying
                          ? "border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)] bg-primary/5 translate-x-1"
                          : "hover:border-primary/30 hover:bg-muted/30"
                      }
                    `}
                  >
                    {isPlaying && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}
                    <CardContent className="p-3 flex items-start space-x-3">
                      <div
                        className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0
                        ${isPlaying ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors"}
                      `}
                      >
                        {isPlaying ? (
                          <Play className="h-3 w-3 fill-current" />
                        ) : (
                          index + 1
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <p
                          className={`text-sm font-medium line-clamp-2 leading-tight ${isPlaying ? "text-primary" : "text-foreground"}`}
                          dangerouslySetInnerHTML={{ __html: song.title }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
