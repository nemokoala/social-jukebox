"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function Home() {
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
      setErrorText("Failed to create room. Please try again.");
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
      setErrorText("Room not found. Please check the code.");
      setIsJoining(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Music className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Social Jukebox
          </h1>
          <p className="text-muted-foreground">
            Listen to music together with friends.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Join a Room</CardTitle>
            <CardDescription>
              Enter a 4-digit code to join an existing session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="flex space-x-2">
              <Input
                placeholder="Room Code (e.g. ABCD)"
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
                Join
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
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create a Room</CardTitle>
            <CardDescription>
              Host a new session and play music on this device.
            </CardDescription>
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
                  Creating...
                </>
              ) : (
                "Create New Room"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
