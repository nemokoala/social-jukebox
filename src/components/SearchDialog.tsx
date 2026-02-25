"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { searchYouTubeVideos, YouTubeVideo } from "@/app/actions/youtube";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SearchDialogProps {
  roomId: string;
  trigger?: React.ReactNode;
}

export function SearchDialog({ roomId, trigger }: SearchDialogProps) {
  const [open, setOpen] = useState(false);
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

      toast.success("Song added to the playlist!");
      setOpen(false);
    } catch (error) {
      console.error("Error adding video:", error);
      toast.error("Failed to add song.");
    } finally {
      setIsAddingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button className="w-full py-4 px-4 bg-primary text-primary-foreground font-semibold rounded-md shadow flex items-center justify-center space-x-2">
            <span>+ Add Song from YouTube</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search YouTube</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex space-x-2">
          <Input
            placeholder="Search for music..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={isPending || !query.trim()}>
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Search
          </Button>
        </form>

        <div className="flex-1 overflow-y-auto mt-4 space-y-4">
          {results.length === 0 && !isPending && query && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              No results found.
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
                  "Add"
                )}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
