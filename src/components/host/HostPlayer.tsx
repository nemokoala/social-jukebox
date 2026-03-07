"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import YouTube, { YouTubeEvent, YouTubeProps } from "react-youtube";
import { RoomHeader } from "@/components/RoomHeader";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Music, Disc3, Info, X } from "lucide-react";
import { PlaylistSong } from "../../types/types";

interface HostPlayerProps {
  code: string | null;
  currentSong: PlaylistSong | null;
  showAlert: boolean;
  setShowAlert: (v: boolean) => void;
  opts: YouTubeProps["opts"];
  handleReady: (event: YouTubeEvent) => void;
  handleStateChange: (event: YouTubeEvent) => void;
  copyRoomCode: () => void;
}

export function HostPlayer({
  code,
  currentSong,
  showAlert,
  setShowAlert,
  opts,
  handleReady,
  handleStateChange,
  copyRoomCode,
}: HostPlayerProps) {
  const t = useTranslations("HostRoom");

  return (
    <div className="flex flex-col shrink-0 md:flex-2 md:min-h-0 md:overflow-hidden relative shadow-sm z-10">
      <RoomHeader
        title={t("header_title")}
        code={code || ""}
        subtitle={t("header_subtitle")}
        isHost
        onCopy={copyRoomCode}
      />

      <main className="flex flex-col p-3 md:p-6 bg-dot-pattern relative md:flex-1 md:justify-center overflow-auto md:overflow-hidden">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />

        <div className="w-full max-w-5xl mx-auto z-10 flex flex-col gap-3 md:gap-6 md:mt-auto md:mb-auto">
          <AnimatePresence>
            {showAlert && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, scale: 0.97 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <Alert className="bg-stone-400/10 border-primary/20 text-foreground relative pr-12">
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
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="overflow-hidden border-border/50 shadow-md md:shadow-2xl bg-card/80 backdrop-blur-xl ring-1 ring-white/10">
            <div className="aspect-video relative bg-background flex items-center justify-center group overflow-hidden">
              <AnimatePresence mode="wait">
                {!currentSong ? (
                  <motion.div
                    key="no-song"
                    className="text-muted-foreground flex flex-col items-center gap-2 md:gap-4 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="h-16 w-16 md:h-24 md:w-24 rounded-full bg-muted/20 flex items-center justify-center mb-1 md:mb-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Disc3 className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground opacity-50" />
                      </motion.div>
                    </div>
                    <p className="text-base md:text-lg font-medium">
                      {t("waiting_title")}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground/60">
                      {t("waiting_subtitle")}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={currentSong.video_id}
                    className="absolute inset-0 w-full h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <YouTube
                      videoId={currentSong.video_id}
                      opts={opts}
                      onReady={handleReady}
                      onStateChange={handleStateChange}
                      className="absolute inset-0 w-full h-full pointer-events-auto z-10"
                      iframeClassName="w-full h-full border-0 absolute top-0 left-0"
                    />
                    <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-16 md:h-20 border-t border-border/50 flex items-center bg-card">
              <motion.div
                className="w-full p-3 md:p-4 flex items-center gap-3 md:gap-4"
                animate={{ opacity: currentSong ? 1 : 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div className="h-10 w-10 md:h-12 md:w-12 rounded bg-muted flex items-center justify-center shrink-0">
                  <Music className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-medium md:font-semibold text-sm md:text-lg line-clamp-1"
                    dangerouslySetInnerHTML={{
                      __html: currentSong?.title ?? "",
                    }}
                  />
                  <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                      <motion.span
                        className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
                        animate={{
                          scale: currentSong ? [1, 2, 1] : 1,
                          opacity: currentSong ? [0.75, 0, 0.75] : 0,
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: currentSong ? Infinity : 0,
                          ease: "easeOut",
                        }}
                      />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-primary" />
                    </span>
                    {t("now_playing")}
                  </p>
                </div>
              </motion.div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
