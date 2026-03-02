"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import YouTube, { YouTubeEvent } from "react-youtube";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Music, Play, Disc3, Info, X } from "lucide-react";
import { toast } from "sonner";
import { RoomHeader } from "@/components/RoomHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface PlaylistSong {
  id: string;
  video_id: string;
  title: string;
  thumbnail_url: string;
  added_at: string;
}

export default function HostRoom({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [code, setCode] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [currentSong, setCurrentSong] = useState<PlaylistSong | null>(null);
  const [playIndex, setPlayIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(true);
  const router = useRouter();
  const t = useTranslations("HostRoom");

  useEffect(() => {
    params.then((p) => setCode(p.code.toUpperCase()));
  }, [params]);

  // 1. 방 정보 가져오기 (play_index 포함)
  const { data: roomData, error: roomError } = useQuery({
    queryKey: ["room", code],
    queryFn: async () => {
      if (!code) return null;
      const { data: room, error } = await supabase
        .from("rooms")
        .select("id, play_index")
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (error || !room) {
        throw error;
      }
      return room as { id: string; play_index: number };
    },
    enabled: !!code,
  });

  const roomId = roomData?.id;

  // DB의 play_index로 초기 동기화 (최초 1회)
  const hasInitializedIndex = useRef(false);
  useEffect(() => {
    if (roomData?.play_index !== undefined && !hasInitializedIndex.current) {
      hasInitializedIndex.current = true;
      setPlayIndex(roomData.play_index);
    }
  }, [roomData]);

  // 2. 재생 목록 가져오기 (played_at 필터 제거 - 전체 목록 유지)
  const { data: playlist = [], isError: playlistError } = useQuery({
    queryKey: ["playlist", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from("playlist")
        .select("*")
        .eq("room_id", roomId)
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
      toast.error(t("error_room_not_found"));
      router.push("/");
    } else if (playlistError) {
      toast.error(t("error_fetch_playlist"));
      router.push("/");
    }
  }, [roomError, playlistError, router, t]);

  // YouTube 플레이어 이벤트 핸들러에서 최신 상태에 접근하기 위한 ref (클로저 문제 방지)
  const playIndexRef = useRef(0);
  const playlistRef = useRef<PlaylistSong[]>([]);
  // YouTube 플레이어 인스턴스 ref (1곡 반복 재생 시 직접 제어용)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);

  useEffect(() => {
    playIndexRef.current = playIndex;
  }, [playIndex]);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  // 재생 로직 처리: playlist가 업데이트될 때 현재 곡 동기화
  useEffect(() => {
    if (playlist.length === 0) {
      setCurrentSong(null);
      return;
    }
    // playIndex가 범위를 벗어나면 0으로 리셋
    const safeIndex = playIndex < playlist.length ? playIndex : 0;
    if (safeIndex !== playIndex) setPlayIndex(0);
    setCurrentSong(playlist[safeIndex]);
  }, [playlist]); // eslint-disable-line react-hooks/exhaustive-deps

  // YouTube 플레이어 상태 변경 핸들러
  const handleStateChange = (event: YouTubeEvent) => {
    // 0은 동영상 종료(Ended) 상태를 의미합니다.
    if (event.data === 0) {
      const currentPlaylist = playlistRef.current;
      if (currentPlaylist.length === 0) return;

      // 다음 인덱스 계산 (마지막 곡이면 0으로 순환)
      const nextIndex = (playIndexRef.current + 1) % currentPlaylist.length;

      if (nextIndex === playIndexRef.current) {
        // 1곡인 경우: videoId가 동일해서 React가 변경을 감지하지 못하므로
        // YouTube 플레이어 API를 직접 호출하여 처음부터 다시 재생
        playerRef.current?.seekTo(0);
        playerRef.current?.playVideo();
      } else {
        setPlayIndex(nextIndex);
        setCurrentSong(currentPlaylist[nextIndex]);
        // DB의 play_index 업데이트 → 게스트 페이지에서 Realtime으로 감지
        if (roomId) {
          supabase
            .from("rooms")
            .update({ play_index: nextIndex })
            .eq("id", roomId)
            .then(() => {});
        }
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
    // 플레이어 인스턴스를 ref에 저장 (1곡 반복 재생 시 직접 제어용)
    playerRef.current = event.target;
    // 백그라운드 재생을 강제할 수 있도록 준비가 완료되면 명시적으로 재생을 호출합니다
    event.target.playVideo();
  };

  const copyRoomCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success(t("toast_copied"));
    }
  };

  // 대기열에서 특정 곡 클릭 시 즉시 재생
  const handlePlaySong = (song: PlaylistSong, index: number) => {
    if (currentSong?.id === song.id) return; // 이미 재생 중이면 무시
    setPlayIndex(index);
    setCurrentSong(song);
    if (roomId) {
      supabase
        .from("rooms")
        .update({ play_index: index })
        .eq("id", roomId)
        .then(() => {});
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-dvh w-full bg-background text-foreground overflow-hidden">
      {/* 플레이어 사이드 */}
      <div className="flex-1 flex flex-col min-h-0 md:min-h-screen relative">
        <RoomHeader
          title={t("header_title")}
          code={code || ""}
          subtitle={t("header_subtitle")}
          isHost
          onCopy={copyRoomCode}
        />

        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 bg-dot-pattern relative overflow-auto">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />

          {/* YouTube 플레이어 래퍼 */}
          <div className="w-full max-w-5xl z-10 flex flex-col gap-4 md:gap-6 mt-auto mb-auto">
            {showAlert && (
              <Alert className="bg-stone-400/10 border-primary/20 text-foreground animate-in fade-in slide-in-from-top duration-500 relative pr-12">
                <Info className="h-4 w-4" />
                <AlertTitle className="font-semibold">
                  {t("warning_autoplay_title")}
                </AlertTitle>
                <AlertDescription className="text-muted-foreground pr-4">
                  {t("warning_autoplay_description")}
                </AlertDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:bg-primary/20 hover:text-foreground"
                  onClick={() => setShowAlert(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </Alert>
            )}

            <Card className="overflow-hidden border-border/50 shadow-lg md:shadow-2xl bg-card/80 backdrop-blur-xl ring-1 ring-white/10">
              <div className="aspect-video relative bg-background flex items-center justify-center group overflow-hidden">
                {!currentSong ? (
                  <div className="text-muted-foreground flex flex-col items-center gap-4 animate-in fade-in duration-1000">
                    <div className="h-24 w-24 rounded-full bg-muted/20 flex items-center justify-center mb-2">
                      <Disc3 className="h-12 w-12 text-muted-foreground animate-spin-slow opacity-50" />
                    </div>
                    <p className="text-lg font-medium">{t("waiting_title")}</p>
                    <p className="text-sm text-muted-foreground/60">
                      {t("waiting_subtitle")}
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
                      {t("now_playing")}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>

      {/* 오른쪽 사이드: 대기열 사이드바 (모바일은 하단으로 이동) */}
      <div className="w-full md:w-[400px] h-[40vh] md:h-full flex flex-col border-t md:border-t-0 md:border-l bg-card/30 backdrop-blur-xl shrink-0">
        <div className="px-6 py-5 border-b bg-card/50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Disc3 className="w-5 h-5 text-primary" />
            {t("up_next")}
            <Badge
              variant="secondary"
              className="ml-auto rounded-full font-mono"
            >
              {t("songs_count", { count: playlist.length })}
            </Badge>
          </h2>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-3">
            {playlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 p-6 border border-dashed rounded-xl bg-muted/10">
                <Music className="h-8 w-8 text-muted-foreground/50" />
                <p
                  className="text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: t.raw("queue_empty") }}
                />
              </div>
            ) : (
              playlist.map((song, index) => {
                const isPlaying = currentSong?.id === song.id;

                return (
                  <Card
                    key={song.id}
                    onClick={() => handlePlaySong(song, index)}
                    className={`transition-all duration-300 overflow-hidden relative group
                      ${
                        isPlaying
                          ? "border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)] bg-primary/5 translate-x-1 cursor-default"
                          : "hover:border-primary/30 hover:bg-muted/30 cursor-pointer"
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
