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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(14,165,233,0.12),transparent_34rem),radial-gradient(circle_at_18%_78%,rgba(217,70,239,0.12),transparent_28rem),linear-gradient(180deg,rgba(255,255,255,0.82),rgba(253,242,248,0.7))] backdrop-blur-[2px] dark:bg-[radial-gradient(circle_at_50%_18%,rgba(14,165,233,0.18),transparent_34rem),radial-gradient(circle_at_18%_78%,rgba(217,70,239,0.16),transparent_28rem),linear-gradient(180deg,rgba(18,7,31,0.86),rgba(9,13,28,0.92))]" />

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

          <Card className="gap-0 overflow-hidden border-fuchsia-200/70 bg-white/70 py-0 shadow-md shadow-fuchsia-500/15 ring-1 ring-white/70 md:shadow-2xl dark:border-white/10 dark:bg-white/10 dark:ring-white/10">
            <div className="aspect-video relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_22%_18%,rgba(244,63,94,0.24),transparent_24rem),radial-gradient(circle_at_80%_12%,rgba(14,165,233,0.22),transparent_26rem),radial-gradient(circle_at_50%_82%,rgba(217,70,239,0.26),transparent_28rem),linear-gradient(135deg,#fff7ed_0%,#fdf2f8_42%,#eef2ff_100%)] group dark:bg-[radial-gradient(circle_at_22%_18%,rgba(244,63,94,0.2),transparent_24rem),radial-gradient(circle_at_80%_12%,rgba(14,165,233,0.18),transparent_26rem),radial-gradient(circle_at_50%_82%,rgba(217,70,239,0.22),transparent_28rem),linear-gradient(135deg,#2b1238_0%,#21113d_46%,#10243f_100%)]">
              <div
                className="pointer-events-none absolute inset-0 opacity-35 dark:opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(124,58,237,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.1) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/65 to-transparent dark:from-slate-950/35" />
              <AnimatePresence mode="wait">
                {!currentSong ? (
                  <motion.div
                    key="no-song"
                    className="relative z-10 flex flex-col items-center gap-2 p-4 text-slate-700 md:gap-4 dark:text-slate-100"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/55 shadow-2xl shadow-fuchsia-500/20 backdrop-blur md:mb-2 md:h-24 md:w-24 dark:border-white/10 dark:bg-white/10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Disc3 className="h-8 w-8 text-fuchsia-500 opacity-80 md:h-12 md:w-12 dark:text-fuchsia-200" />
                      </motion.div>
                    </div>
                    <p className="text-base md:text-lg font-medium">
                      {t("waiting_title")}
                    </p>
                    <p className="text-xs text-slate-500 md:text-sm dark:text-slate-300">
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
                    <div className="absolute -inset-4 bg-fuchsia-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {currentSong && (
                <motion.div
                  className="flex h-16 items-center border-t border-fuchsia-200/60 bg-white/72 text-slate-950 backdrop-blur md:h-20 dark:border-white/10 dark:bg-slate-950/45 dark:text-white"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div className="flex w-full items-center gap-3 p-3 md:gap-4 md:p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 via-fuchsia-500 to-sky-500 shadow-lg shadow-fuchsia-500/20 md:h-12 md:w-12">
                      <Music className="h-5 w-5 text-white md:h-6 md:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="line-clamp-1 text-sm font-medium md:text-lg md:font-semibold"
                        dangerouslySetInnerHTML={{
                          __html: currentSong.title,
                        }}
                      />
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 md:text-sm">
                        <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                          <motion.span
                            className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
                            animate={{
                              scale: [1, 2, 1],
                              opacity: [0.75, 0, 0.75],
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              ease: "easeOut",
                            }}
                          />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary md:h-2 md:w-2" />
                        </span>
                        {t("now_playing")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </main>
    </div>
  );
}
