import React from 'react';
import { Terminal as TerminalIcon, ShieldCheck, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Log } from "@shared/schema";
import { useBot } from "@/hooks/use-bot";

export default function Logs() {
  const { botId } = useBot();
  const { data: logs = [] } = useQuery<Log[]>({ 
    queryKey: [`/api/bot/${botId}/logs`],
    enabled: !!botId,
    refetchInterval: 2000 
  });

  return (
    <div className="space-y-12">
      <header className="flex items-center justify-between pb-12 border-b border-white/5">
        <div>
          <h2 className="text-4xl font-display font-black tracking-tighter text-gradient mb-2 uppercase">Kernel Logs</h2>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em]">Internal System Stream</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/5">
             <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
             <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Live Stream</span>
           </div>
        </div>
      </header>

      <Card className="glass-modern border-none bg-card/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
        <CardHeader className="bg-white/[0.02] py-6 border-b border-white/5">
          <CardTitle className="text-[10px] font-display uppercase tracking-[0.4em] text-white/60 flex items-center gap-3">
            <TerminalIcon className="h-4 w-4 text-primary" /> Kernel_Standard_Output
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-250px)] min-h-[400px] p-8 custom-scrollbar overflow-auto">
            <div className="font-mono text-[11px] space-y-6">
              <AnimatePresence initial={false}>
                {logs.map(log => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={log.id} className="group">
                    <div className="flex items-center justify-between mb-2">
                       <span className={`font-black uppercase tracking-widest text-[9px] ${
                         log.level === 'error' ? 'text-red-500' : 
                         log.level === 'success' ? 'text-primary' : 
                         log.level === 'warn' ? 'text-yellow-500/60' : 'text-white/10'
                       }`}>{log.level}</span>
                       <span className="text-[8px] text-white/5 font-mono">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    </div>
                    <div className="text-white/50 group-hover:text-white transition-colors pl-6 border-l border-white/5 break-words font-light tracking-wide leading-relaxed">
                      {log.message}
                    </div>
                  </motion.div>
                ))}
                {logs.length === 0 && (
                  <div className="p-24 text-center text-white/5 uppercase font-display tracking-[1em] text-xs">Waiting for events</div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
