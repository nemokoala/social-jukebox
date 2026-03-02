"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { SearchDialog } from "@/components/SearchDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Keep useQueryClient
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Music, Play, Plus, Search, Disc3, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface PlaylistSong {
  id: string;
  video_id: string;
  title: string;
  thumbnail_url: string;
  played_at: string | null;
  added_at: string; // Added for sorting
}

export default function GuestRoom({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [code, setCode] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const t = useTranslations("GuestRoom");

  useEffect(() => {
    params.then((p) => setCode(p.code.toUpperCase()));
  }, [params]);

  // 1. Fetch Room ID based on code
  const { data: roomId, isLoading: isRoomLoading } = useQuery({
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

  // 2. Fetch active playlist
  const { data: playlist = [], isLoading: isPlaylistLoading } = useQuery({
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

  const currentSong = playlist.length > 0 ? playlist[0] : null;
  const queue = playlist.length > 1 ? playlist.slice(1) : [];

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`playlist_room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "playlist",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Realtime change:", payload);
          queryClient.invalidateQueries({ queryKey: ["playlist", roomId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  if (isRoomLoading || !code) {
    return (
      <div className="flex h-screen items-center justify-center">
        {t("loading_room")}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground">
      {/* Header */}
      <header className="px-4 py-3 border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <Radio className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">
              {t("header_title")}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              {t("header_code")}{" "}
              <Badge
                variant="secondary"
                className="px-1.5 py-0 h-4 text-[10px]"
              >
                {code}
              </Badge>
            </p>
          </div>
        </div>

        <SearchDialog
          roomId={roomId!}
          trigger={
            <Button size="sm" className="gap-2 shadow-sm rounded-full px-4">
              <Plus className="w-4 h-4" />
              {t("btn_add_song")}
            </Button>
          }
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-4 px-4 pb-24 md:pb-6 max-w-2xl mx-auto w-full gap-6">
        {/* Currently Playing Card */}
        <section className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Disc3 className="w-4 h-4" /> {t("now_playing")}
            </h2>
          </div>

          <Card className="overflow-hidden border-primary/20 shadow-md bg-gradient-to-br from-card to-card hover:shadow-lg transition-all">
            {isPlaylistLoading ? (
              <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px] bg-muted/10">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-1 animate-pulse">
                  <Music className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium animate-pulse">
                  {t("loading_song")}
                </p>
              </CardContent>
            ) : currentSong ? (
              <div className="flex flex-col sm:flex-row border-primary/10">
                <div className="relative aspect-video sm:w-48 sm:aspect-square sm:shrink-0 bg-muted overflow-hidden">
                  <img
                    src={currentSong.thumbnail_url}
                    alt={currentSong.title}
                    className="w-full h-full object-cover sm:object-center transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center sm:hidden">
                    <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm shadow-xl">
                      <Play className="h-5 w-5 fill-current text-primary-foreground ml-1" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-4 sm:p-5 flex flex-col justify-center flex-1 min-w-0 bg-card/50">
                  <Badge className="w-fit mb-2 animate-pulse bg-primary/20 text-primary hover:bg-primary/30 border-none group">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    {t("playing_badge")}
                  </Badge>
                  <h3
                    className="font-bold text-lg leading-tight line-clamp-2 mb-1"
                    dangerouslySetInnerHTML={{ __html: currentSong.title }}
                  />
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-auto pt-2">
                    <Music className="w-3.5 h-3.5" />
                    {t("youtube_audio")}
                  </p>
                </CardContent>
              </div>
            ) : (
              <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px] bg-muted/10">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-1">
                  <Music className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {t("no_song")}
                </p>
                <SearchDialog
                  roomId={roomId!}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 rounded-full"
                    >
                      {t("first_to_add")}
                    </Button>
                  }
                />
              </CardContent>
            )}
          </Card>
        </section>

        {/* Up Next List */}
        <section className="flex-1 flex flex-col animate-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              {t("up_next")}
              <Badge
                variant="outline"
                className="ml-1 font-mono text-xs rounded-full px-2"
              >
                {queue.length}
              </Badge>
            </h2>
          </div>

          <div className="flex-1 border rounded-xl overflow-hidden bg-card/50 shadow-sm">
            {isPlaylistLoading ? (
              <div className="flex flex-col items-center justify-center h-48 text-center space-y-4 p-6 animate-pulse">
                <Search className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">
                  {t("loading_queue")}
                </p>
              </div>
            ) : queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center space-y-4 p-6">
                <Search className="h-10 w-10 text-muted-foreground/30" />
                <p
                  className="text-muted-foreground text-sm"
                  dangerouslySetInnerHTML={{ __html: t.raw("empty_queue") }}
                />
              </div>
            ) : (
              <ScrollArea className="h-[40vh] md:h-auto md:max-h-[500px]">
                <div className="p-2 space-y-1">
                  {queue.map((song, index) => (
                    <Card
                      key={song.id}
                      className="border-none shadow-none hover:bg-muted/50 rounded-lg transition-colors group"
                    >
                      <CardContent className="p-2 sm:p-3 flex items-center space-x-3">
                        <div className="relative w-14 h-10 sm:w-16 sm:h-12 flex-shrink-0 bg-muted rounded overflow-hidden shadow-sm">
                          <img
                            src={song.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 pr-2">
                          <p
                            className="text-sm font-medium leading-snug line-clamp-2 mb-0.5"
                            dangerouslySetInnerHTML={{ __html: song.title }}
                          />
                          <p className="text-xs text-muted-foreground font-mono">
                            {t("in_queue", { number: index + 1 })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </section>
      </main>

      {/* Mobile Sticky Add Button (visible only on small screens when scrolling) */}
      <div className="fixed bottom-6 right-4 sm:hidden z-20">
        <SearchDialog
          roomId={roomId!}
          trigger={
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-xl shadow-primary/20 p-0"
            >
              <Plus className="w-6 h-6" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
