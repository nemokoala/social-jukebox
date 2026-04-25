"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Disc3, Loader2, Music, Radio, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TutorialModal } from "@/components/TutorialModal";

export default function Home() {
  const t = useTranslations("Index");
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [errorText, setErrorText] = useState("");

  const generateRoomCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setErrorText("");
    const newCode = generateRoomCode();

    try {
      const { error } = await supabase
        .from("rooms")
        .insert([{ code: newCode }]);

      if (error) throw error;

      router.push(`/room/${newCode}/host`);
    } catch (error) {
      console.error("Error creating room:", error);
      setErrorText(t("create_error"));
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode || roomCode.length !== 4) return;

    setIsJoining(true);
    setErrorText("");

    const upperCode = roomCode.toUpperCase();

    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("code")
        .eq("code", upperCode)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        throw new Error("Room not found or inactive.");
      }

      router.push(`/room/${upperCode}`);
    } catch (error) {
      console.error("Error joining room:", error);
      setErrorText(t("join_error_not_found"));
      setIsJoining(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#fff7ed] p-4 text-slate-950 dark:bg-[#12071f] dark:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.28),transparent_28%),radial-gradient(circle_at_80%_12%,rgba(14,165,233,0.26),transparent_30%),radial-gradient(circle_at_50%_92%,rgba(250,204,21,0.24),transparent_32%),linear-gradient(135deg,#fff7ed_0%,#fdf2f8_38%,#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(244,63,94,0.26),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(14,165,233,0.24),transparent_30%),radial-gradient(circle_at_52%_92%,rgba(250,204,21,0.16),transparent_34%),linear-gradient(135deg,#12071f_0%,#21113d_42%,#061827_100%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/50 to-transparent dark:from-white/10" />
      <div className="relative w-full max-w-md space-y-7">
        <div className="flex flex-col items-center space-y-5">
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="relative rounded-[2rem] bg-gradient-to-br from-rose-500 via-fuchsia-500 to-sky-400 p-[3px] shadow-2xl shadow-fuchsia-500/20">
              <div className="rounded-[1.8rem] bg-white/88 p-4 backdrop-blur dark:bg-slate-950/70">
                <Music className="h-9 w-9 text-fuchsia-600 dark:text-fuchsia-300" />
              </div>
              <Sparkles className="absolute -right-2 -top-2 h-5 w-5 fill-amber-300 text-amber-300" />
            </div>
            <h1 className="bg-gradient-to-r from-rose-600 via-fuchsia-600 to-sky-500 bg-clip-text text-5xl font-black tracking-tighter text-transparent sm:text-6xl">
              {t("title")}
            </h1>
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">
              {t("description")}
            </p>
            <div className="flex h-9 items-end gap-1.5" aria-hidden="true">
              {[18, 28, 14, 34, 22, 30, 16].map((height, index) => (
                <span
                  key={height + index}
                  className="w-2 rounded-full bg-gradient-to-t from-sky-400 via-fuchsia-500 to-amber-300 shadow-sm shadow-fuchsia-500/30"
                  style={{ height }}
                />
              ))}
            </div>
          </div>
          <TutorialModal />
        </div>

        <Card className="overflow-hidden border-white/70 bg-white/78 shadow-2xl shadow-rose-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-fuchsia-950/30">
          <CardHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-fuchsia-500 text-white shadow-lg shadow-sky-500/25">
              <Radio className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl">{t("join_title")}</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              {t("join_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="flex space-x-2">
              <Input
                placeholder={t("join_placeholder")}
                className="h-12 rounded-xl border-white/80 bg-white/90 px-4 text-base uppercase shadow-inner shadow-slate-200/70 placeholder:text-slate-400 focus-visible:ring-fuchsia-400/40 dark:border-white/10 dark:bg-white/10 dark:shadow-none"
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                disabled={isJoining || isCreating}
              />
              <Button
                type="submit"
                disabled={isJoining || isCreating || roomCode.length !== 4}
                className="h-12 rounded-xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-500 px-5 text-white shadow-lg shadow-fuchsia-500/25 hover:brightness-110"
              >
                {isJoining ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {t("join_button")}
              </Button>
            </form>
            {errorText && (
              <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-300">
                {errorText}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="h-px w-full bg-gradient-to-r from-transparent via-fuchsia-300 to-transparent dark:via-fuchsia-400/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="rounded-full bg-white/80 px-3 py-1 font-semibold text-fuchsia-600 shadow-sm backdrop-blur dark:bg-slate-950/60 dark:text-fuchsia-200">
              {t("or")}
            </span>
          </div>
        </div>

        <Card className="overflow-hidden border-white/70 bg-white/78 shadow-2xl shadow-sky-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-sky-950/30">
          <CardHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-500/25">
              <Disc3 className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl">{t("create_title")}</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              {t("create_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating || isJoining}
              className="h-12 w-full rounded-xl border border-fuchsia-200/70 bg-white/85 text-base font-bold text-fuchsia-700 shadow-lg shadow-fuchsia-500/10 hover:bg-fuchsia-50 hover:text-fuchsia-800 dark:border-white/10 dark:bg-white/10 dark:text-fuchsia-100 dark:hover:bg-white/15"
              variant="outline"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("create_loading")}
                </>
              ) : (
                t("create_button")
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
