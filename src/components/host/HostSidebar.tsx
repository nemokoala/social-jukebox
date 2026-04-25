"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { PlaylistSong } from "../../types/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Disc3,
  RefreshCw,
  Link2,
  QrCode,
  Copy,
  Check,
  Music,
  Play,
} from "lucide-react";

interface HostSidebarProps {
  code: string | null;
  playlist: PlaylistSong[];
  currentSong: PlaylistSong | null;
  showShare: boolean;
  setShowShare: React.Dispatch<React.SetStateAction<boolean>>;
  handleReconnect: () => void;
  isReconnecting: boolean;
  roomUrl: string;
  urlCopied: boolean;
  copyRoomUrl: () => void;
  handlePlaySong: (song: PlaylistSong, index: number) => void;
}

export function HostSidebar({
  code,
  playlist,
  currentSong,
  showShare,
  setShowShare,
  handleReconnect,
  isReconnecting,
  roomUrl,
  urlCopied,
  copyRoomUrl,
  handlePlaySong,
}: HostSidebarProps) {
  const t = useTranslations("HostRoom");

  return (
    <motion.div
      className="flex flex-col flex-1 min-h-0 w-full md:w-[400px] border-t md:border-t-0 md:border-l bg-card/30 backdrop-blur-xl shrink-0"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
    >
      <div className="px-4 md:px-6 py-4 md:py-5 border-b bg-card/50 shrink-0 z-20">
        <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <Disc3 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          {t("up_next")}
          <Badge
            variant="secondary"
            className="ml-auto rounded-full font-mono text-xs md:text-sm"
          >
            {t("songs_count", { count: playlist.length })}
          </Badge>
          <Button
            variant={showShare ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground ml-2 md:hidden"
            onClick={() => setShowShare((v) => !v)}
            title={t("btn_share")}
          >
            <motion.div
              animate={{ rotate: showShare ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <QrCode className="h-3.5 w-3.5" />
            </motion.div>
          </Button>
          <Button
            variant={showShare ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground ml-2 hidden md:inline-flex"
            onClick={() => setShowShare((v) => !v)}
            title={t("btn_share")}
          >
            <motion.div
              animate={{ rotate: showShare ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <QrCode className="h-3.5 w-3.5" />
            </motion.div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleReconnect}
            disabled={isReconnecting}
            title={t("btn_reconnect")}
          >
            <motion.div
              animate={{ rotate: isReconnecting ? 360 : 0 }}
              transition={{
                duration: 0.8,
                repeat: isReconnecting ? Infinity : 0,
                ease: "linear",
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </motion.div>
          </Button>
        </h2>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden md:px-4 pb-4">
        <AnimatePresence initial={false}>
          {showShare && (
            <motion.div
              key="share-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-b bg-card/50 overflow-hidden shrink-0 z-10"
            >
              <div className="p-3 md:p-4 flex flex-col items-center gap-3 md:gap-4">
                <div className="flex flex-col items-center gap-1.5 md:gap-2 shrink-0">
                  <div className="p-2 md:p-2.5 rounded-xl bg-white shadow-md ring-1 ring-border/20">
                    <QRCodeSVG
                      value={roomUrl}
                      size={90}
                      className="md:w-[120px] md:h-[120px]"
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-widest">
                      {t("share_code_label")}
                    </p>
                    <p className="text-xl md:text-3xl font-black font-mono tracking-[0.2em] text-primary">
                      {code}
                    </p>
                  </div>
                </div>

                <div className="flex-1 w-full flex flex-col gap-1.5 md:gap-2 justify-center">
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-2 py-1.5 md:px-3 md:py-2 max-w-full overflow-hidden">
                    <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="text-[10px] md:text-[11px] text-muted-foreground font-mono truncate overflow-hidden whitespace-nowrap">
                      {roomUrl}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-muted-foreground hover:text-foreground ml-auto"
                      onClick={copyRoomUrl}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {urlCopied ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Check className="h-3 w-3 md:h-3.5 md:w-3.5 text-green-500" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Copy className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </div>
                  <p className="text-[10px] md:text-[11px] text-muted-foreground text-center">
                    {t("share_hint")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="py-2 md:py-4 space-y-2 md:space-y-3 pb-4 md:pb-0 px-2 md:px-0">
          <AnimatePresence>
            {playlist.length === 0 ? (
              <motion.div
                key="empty"
                className="flex flex-col items-center justify-center h-32 md:h-40 text-center space-y-2 md:space-y-3 p-4 md:p-6 border border-dashed rounded-xl bg-muted/10 mt-2 mx-2 md:mx-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Music className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/50" />
                <p
                  className="text-xs md:text-sm text-muted-foreground flex items-center"
                  dangerouslySetInnerHTML={{ __html: t.raw("queue_empty") }}
                />
              </motion.div>
            ) : (
              playlist.map((song, index) => {
                const isPlaying = currentSong?.id === song.id;

                return (
                  <motion.div
                    key={song.id}
                    layout
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.02,
                      ease: "easeOut",
                    }}
                  >
                    <Card
                      onClick={() => handlePlaySong(song, index)}
                      className={`relative group overflow-hidden gap-0 py-0 shadow-sm shadow-fuchsia-500/5 transition-colors duration-200
                        ${
                          isPlaying
                            ? "border-primary/40 bg-primary/5 cursor-default"
                            : "border-white/50 hover:border-primary/25 hover:bg-muted/20 cursor-pointer dark:border-white/10"
                        }
                      `}
                    >
                      <motion.div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: isPlaying ? 1 : 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ originY: 0.5 }}
                      />
                      <CardContent className="flex min-h-14 items-center space-x-2.5 p-2.5 md:min-h-16 md:space-x-3 md:p-3">
                        <motion.div
                          className={`h-5 w-5 md:h-6 md:w-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-medium shrink-0
                          ${isPlaying ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors"}`}
                          animate={{ scale: isPlaying ? 1.1 : 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isPlaying ? (
                            <Play className="h-2.5 w-2.5 md:h-3 md:w-3 fill-current" />
                          ) : (
                            index + 1
                          )}
                        </motion.div>

                        <div className="flex min-w-0 flex-1 items-center">
                          <p
                            className={`text-xs md:text-sm font-medium line-clamp-2 leading-tight ${isPlaying ? "text-primary" : "text-foreground"}`}
                            dangerouslySetInnerHTML={{ __html: song.title }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
