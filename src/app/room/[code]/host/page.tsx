"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import YouTube, { YouTubeEvent } from "react-youtube";
import { notFound } from "next/navigation";
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
  const [lastPlayedSongId, setLastPlayedSongId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setCode(p.code.toUpperCase()));
  }, [params]);

  // 1. Fetch Room
  const { data: roomId } = useQuery({
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
        notFound();
      }
      return room.id as string;
    },
    enabled: !!code,
  });

  // 2. Fetch Playlist
  const { data: playlist = [] } = useQuery({
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

  // We use a ref so the YouTube player event handlers always have access to the latest state without re-creating the player
  const currentSongRef = useRef<PlaylistSong | null>(null);
  const playlistRef = useRef<PlaylistSong[]>([]);

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  // Handle Playback Logic: only load initially if nothing is playing
  useEffect(() => {
    if (!currentSong && playlist.length > 0) {
      if (
        !lastPlayedSongId ||
        (playlist.length > 0 && playlist.some((s) => s.id !== lastPlayedSongId))
      ) {
        // Auto-start first song on page load async to prevent React cascading render warnings
        const timer = setTimeout(() => {
          setCurrentSong(playlist[0]);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [playlist, currentSong, lastPlayedSongId]);

  // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
  const handleStateChange = async (event: YouTubeEvent) => {
    if (event.data === 0) {
      // ENDED STATE
      const songToEnd = currentSongRef.current;
      if (!songToEnd) return;

      // Set last played immediately so we avoid re-queueing it
      setLastPlayedSongId(songToEnd.id);

      // Find the next song sequentially
      const currentIdx = playlistRef.current.findIndex(
        (s) => s.id === songToEnd.id,
      );
      const nextSong = playlistRef.current[currentIdx + 1];

      if (nextSong) {
        // Immediately queue up the next video without waiting for the DB/effect cycle
        setCurrentSong(nextSong);
      } else {
        // Queue is empty
        setCurrentSong(null);
      }

      // Mark current song as played in DB
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
      autoplay: 1, // Auto-play the video on load
      controls: 1,
      modestbranding: 1,
      playsinline: 1, // Required for iOS and helps with background play on some browsers
    },
  };

  const handleReady = (event: YouTubeEvent) => {
    // Explicitly call play once ready to help force background play
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
      {/* Left side: Player */}
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

          {/* YouTube Player Wrapper */}
          <div className="w-full max-w-5xl z-10 flex flex-col gap-6">
            <Card className="overflow-hidden border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl ring-1 ring-white/10">
              <div className="aspect-video relative bg-black flex items-center justify-center group">
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
                    {/* Ambient glow effect behind playing video */}
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

      {/* Right side: Queue Sidebar */}
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
