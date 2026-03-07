import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { PlaylistSong } from "@/types/types";

/**
 * 방 정보를 가져오는 쿼리 훅
 * @param code 방 코드 (예: ABCD)
 */
export const useRoomQuery = (code: string | null) => {
  return useQuery({
    queryKey: ["room", code],
    queryFn: async () => {
      if (!code) return null;
      const { data: room, error } = await supabase
        .from("rooms")
        .select("id, play_index")
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (error || !room) {
        throw error || new Error("Room not found");
      }
      return room as { id: string; play_index: number };
    },
    enabled: !!code,
  });
};

/**
 * 재생 목록을 가져오는 쿼리 훅
 * @param roomId 방 고유 ID (UUID)
 */
export const usePlaylistQuery = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ["playlist", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from("playlist")
        .select("*")
        .eq("room_id", roomId)
        .order("added_at", { ascending: true });

      if (error) throw error;
      return data as PlaylistSong[];
    },
    enabled: !!roomId,
  });
};
