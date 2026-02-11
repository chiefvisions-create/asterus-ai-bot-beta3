import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Square, 
  RotateCcw, 
  Settings, 
  Zap,
  AlertTriangle
} from "lucide-react";
import { Bot } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface QuickActionsProps {
  bot: Bot;
  botId: number;
}

export function QuickActions({ bot, botId }: QuickActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/bot/${botId}`, { isRunning: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}`] });
      toast({ title: "Bot Started", description: "Trading bot is now active" });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/bot/${botId}`, { isRunning: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}`] });
      toast({ title: "Bot Stopped", description: "Trading bot has been stopped" });
    },
  });

  const killMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/bot/${botId}/kill`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}`] });
      toast({ title: "Emergency Stop", description: "Bot has been killed immediately", variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/bot/${botId}/paper/reset`, { startingCapital: 10000 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bot/${botId}`] });
      toast({ title: "Paper Trading Reset", description: "Account reset to $10,000" });
    },
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700" data-testid="quick-actions">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
          <Zap className="h-4 w-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!bot.isRunning ? (
          <Button
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700"
            data-testid="button-start-bot"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Bot
          </Button>
        ) : (
          <Button
            onClick={() => stopMutation.mutate()}
            disabled={stopMutation.isPending}
            variant="secondary"
            className="w-full"
            data-testid="button-stop-bot"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Bot
          </Button>
        )}

        {!bot.isLiveMode && (
          <Button
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            variant="outline"
            className="w-full border-slate-600"
            data-testid="button-reset-paper"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Paper Account
          </Button>
        )}

        <Button
          onClick={() => killMutation.mutate()}
          disabled={killMutation.isPending}
          variant="destructive"
          className="w-full"
          data-testid="button-emergency-stop"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Emergency Stop
        </Button>
      </CardContent>
    </Card>
  );
}
