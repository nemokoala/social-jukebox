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
import { Music, Loader2 } from "lucide-react";
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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Music className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <TutorialModal />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("join_title")}</CardTitle>
            <CardDescription>{t("join_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="flex space-x-2">
              <Input
                placeholder={t("join_placeholder")}
                className="uppercase"
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                disabled={isJoining || isCreating}
              />
              <Button
                type="submit"
                disabled={isJoining || isCreating || roomCode.length !== 4}
              >
                {isJoining ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {t("join_button")}
              </Button>
            </form>
            {errorText && (
              <p className="mt-2 text-sm text-red-500">{errorText}</p>
            )}
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t("or")}
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("create_title")}</CardTitle>
            <CardDescription>{t("create_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating || isJoining}
              className="w-full"
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
