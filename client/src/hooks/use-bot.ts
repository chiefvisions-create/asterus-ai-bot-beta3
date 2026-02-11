import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Bot } from "@shared/schema";

async function fetchUserBot(): Promise<Bot> {
  const res = await fetch("/api/my-bot", {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch bot");
  }
  return res.json();
}

export function useBot() {
  const queryClient = useQueryClient();

  const { data: bot, isLoading, error, refetch } = useQuery<Bot>({
    queryKey: ["my-bot"],
    queryFn: fetchUserBot,
    staleTime: 1000 * 30,
    refetchInterval: 5000,
  });

  const updateBot = useMutation({
    mutationFn: async (updates: Partial<Bot>) => {
      if (!bot) throw new Error("Bot not loaded");
      const res = await fetch(`/api/bot/${bot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update bot");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bot"] });
    },
  });

  return {
    bot,
    botId: bot?.id,
    isLoading,
    error,
    refetch,
    updateBot: updateBot.mutate,
    isUpdating: updateBot.isPending,
  };
}
