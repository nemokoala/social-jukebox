"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { YouTubeEvent } from "react-youtube";
import { useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useRoomQuery, usePlaylistQuery } from "@/queries";
import { toast } from "sonner";

import { HostPlayer } from "../../../../../components/host/HostPlayer";
import { HostSidebar } from "../../../../../components/host/HostSidebar";
import { PlaylistSong } from "@/types/types";

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
  // 구독 재등록 트리거: 증가시키면 useEffect 재실행 → 채널 cleanup + 재구독
  const [subscriptionKey, setSubscriptionKey] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  // 공유 패널 (QR 코드 + URL 복사)
  const [showShare, setShowShare] = useState(true);
  const [urlCopied, setUrlCopied] = useState(false);
  const router = useRouter();
  const t = useTranslations("HostRoom");
  const locale = useLocale();

  useEffect(() => {
    params.then((p) => setCode(p.code.toUpperCase()));
  }, [params]);

  // 1. 방 정보 가져오기 (play_index 포함)
  const { data: roomData, error: roomError } = useRoomQuery(code);

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
  const { data: playlist = [], isError: playlistError } =
    usePlaylistQuery(roomId);

  useEffect(() => {
    if (!roomId) return;

    // subscriptionKey가 바뀔 때마다 채널을 새로 등록 (재연결 시 사용)
    const channel = supabase
      .channel(`host_room_${roomId}_${subscriptionKey}`)
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
  }, [roomId, queryClient, subscriptionKey]);

  // 수동 재연결: 최신 데이터 fetch + 구독 채널 재등록
  const handleReconnect = async () => {
    setIsReconnecting(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["room", code] }),
      queryClient.invalidateQueries({ queryKey: ["playlist", roomId] }),
    ]);
    setSubscriptionKey((k) => k + 1);
    setIsReconnecting(false);
    toast.success(t("toast_reconnected"));
  };

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
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      playsinline: 1,
    },
  };

  const handleReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    event.target.playVideo();
  };

  const copyRoomCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success(t("toast_copied"));
    }
  };

  const roomUrl =
    typeof window !== "undefined" && code
      ? `${window.location.origin}/${locale}/room/${code}`
      : "";

  const copyRoomUrl = () => {
    if (!roomUrl) return;
    navigator.clipboard.writeText(roomUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handlePlaySong = (song: PlaylistSong, index: number) => {
    if (currentSong?.id === song.id) return;
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
    <div className="flex flex-col md:flex-row w-full bg-background text-foreground h-dvh overflow-y-auto">
      <HostPlayer
        code={code}
        currentSong={currentSong}
        showAlert={showAlert}
        setShowAlert={setShowAlert}
        opts={opts}
        handleReady={handleReady}
        handleStateChange={handleStateChange}
        copyRoomCode={copyRoomCode}
      />

      <HostSidebar
        code={code}
        playlist={playlist}
        currentSong={currentSong}
        showShare={showShare}
        setShowShare={setShowShare}
        handleReconnect={handleReconnect}
        isReconnecting={isReconnecting}
        roomUrl={roomUrl}
        urlCopied={urlCopied}
        copyRoomUrl={copyRoomUrl}
        handlePlaySong={handlePlaySong}
      />
    </div>
  );
}
