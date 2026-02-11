import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Loader2, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIChat({ botId }: { botId: number }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm your AI trading assistant powered by GPT. Ask me anything about crypto trading, market analysis, or your bot's strategy." }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", `/api/bot/${botId}/chat`, { 
        message,
        history: messages.slice(-10)
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    },
    onError: () => {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    chatMutation.mutate(userMessage);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="bg-slate-800/50 border-slate-700" data-testid="ai-chat">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-purple-400">
          <Sparkles className="h-5 w-5" />
          GPT Trading Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="h-[200px] pr-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                    <Bot className="h-3 w-3 text-purple-400" />
                  </div>
                )}
                <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                  msg.role === "user" 
                    ? "bg-blue-600/20 text-blue-100" 
                    : "bg-slate-700/50 text-slate-200"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="h-6 w-6 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <User className="h-3 w-3 text-blue-400" />
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                  <Bot className="h-3 w-3 text-purple-400" />
                </div>
                <div className="bg-slate-700/50 rounded-lg px-3 py-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about trading strategies..."
            className="bg-slate-900/50 border-slate-600 text-sm"
            disabled={chatMutation.isPending}
            data-testid="input-chat"
          />
          <Button 
            onClick={handleSend} 
            size="sm"
            disabled={chatMutation.isPending || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-send-chat"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
