import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Log } from "@shared/schema";
import {
  Terminal,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  TrendingUp,
  Shield,
  Bot
} from "lucide-react";

interface ActivityLogProps {
  botId: number;
}

const logLevelConfig = {
  error: { 
    icon: AlertCircle, 
    color: "text-red-400", 
    bg: "bg-red-500/10", 
    border: "border-red-500/30",
    label: "Error"
  },
  warn: { 
    icon: AlertTriangle, 
    color: "text-amber-400", 
    bg: "bg-amber-500/10", 
    border: "border-amber-500/30",
    label: "Warning"
  },
  success: { 
    icon: CheckCircle2, 
    color: "text-green-400", 
    bg: "bg-green-500/10", 
    border: "border-green-500/30",
    label: "Success"
  },
  info: { 
    icon: Info, 
    color: "text-blue-400", 
    bg: "bg-blue-500/10", 
    border: "border-blue-500/30",
    label: "Info"
  }
};

const getLogIcon = (message: string) => {
  if (message.toLowerCase().includes('trade') || message.toLowerCase().includes('order')) {
    return TrendingUp;
  }
  if (message.toLowerCase().includes('signal') || message.toLowerCase().includes('ai')) {
    return Zap;
  }
  if (message.toLowerCase().includes('risk') || message.toLowerCase().includes('stop')) {
    return Shield;
  }
  if (message.toLowerCase().includes('bot') || message.toLowerCase().includes('start') || message.toLowerCase().includes('stop')) {
    return Bot;
  }
  return null;
};

export function ActivityLog({ botId }: ActivityLogProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data: logs = [], isFetching, refetch } = useQuery<Log[]>({
    queryKey: [`/api/bot/${botId}/logs`],
    refetchInterval: 3000,
    staleTime: 0, // Always consider logs stale for live updates
  });

  const filteredLogs = filter 
    ? logs.filter(log => log.level === filter)
    : logs;

  const displayLogs = showAll ? filteredLogs : filteredLogs.slice(0, 15);

  const logCounts = {
    error: logs.filter(l => l.level === 'error').length,
    warn: logs.filter(l => l.level === 'warn').length,
    success: logs.filter(l => l.level === 'success').length,
    info: logs.filter(l => l.level === 'info').length,
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50" data-testid="activity-log">
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2 min-w-0">
            <Terminal className="h-4 w-4 text-green-400 flex-shrink-0" />
            <span className="truncate">Activity Log</span>
            <Badge variant="outline" className="text-[9px] sm:text-[10px] border-slate-600 text-slate-400 ml-1 flex-shrink-0">
              {logs.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {isFetching && (
              <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            )}
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">Live</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0"
              data-testid="button-refresh-logs"
            >
              <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-3 flex-wrap">
          <Button
            variant={filter === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter(null)}
            className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3"
            data-testid="filter-all"
          >
            All ({logs.length})
          </Button>
          {Object.entries(logCounts).map(([level, count]) => {
            const config = logLevelConfig[level as keyof typeof logLevelConfig];
            return (
              <Button
                key={level}
                variant={filter === level ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter(filter === level ? null : level)}
                className={`h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-2 ${filter === level ? config.bg : ''}`}
                data-testid={`filter-${level}`}
              >
                <config.icon className={`h-3 w-3 sm:mr-1 ${config.color}`} />
                <span className="hidden sm:inline">{count}</span>
                <span className="sm:hidden">{count}</span>
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-3 sm:px-6">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <Terminal className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No activity yet</p>
            <p className="text-xs text-slate-500 mt-1">Events will appear here as they happen</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[450px] pr-4 overflow-auto">
              <div className="space-y-2">
                {displayLogs.map((log, index) => {
                  const config = logLevelConfig[log.level as keyof typeof logLevelConfig] || logLevelConfig.info;
                  const Icon = config.icon;
                  const ContextIcon = getLogIcon(log.message);
                  const isExpanded = expandedId === log.id;
                  const showDateHeader = index === 0 || 
                    formatDate(log.timestamp) !== formatDate(displayLogs[index - 1].timestamp);

                  return (
                    <div key={log.id}>
                      {showDateHeader && (
                        <div className="flex items-center gap-2 py-2 mt-2 first:mt-0">
                          <div className="h-px flex-1 bg-slate-700/50" />
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                            {formatDate(log.timestamp)}
                          </span>
                          <div className="h-px flex-1 bg-slate-700/50" />
                        </div>
                      )}
                      <div 
                        className={`rounded-lg border transition-all cursor-pointer hover:bg-slate-800/80 ${config.border} ${config.bg}`}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        data-testid={`log-entry-${log.id}`}
                      >
                        <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3">
                          <div className={`mt-0.5 flex-shrink-0 ${config.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-start gap-2">
                              {ContextIcon && (
                                <ContextIcon className="h-3 w-3 text-slate-400 flex-shrink-0 mt-0.5" />
                              )}
                              <p className={`text-xs sm:text-sm text-white ${isExpanded ? 'whitespace-pre-wrap break-words' : 'line-clamp-2 sm:line-clamp-1'}`}>
                                {log.message}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                              <span className="text-[9px] sm:text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(log.timestamp)}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`text-[8px] sm:text-[9px] py-0 h-4 ${config.border} ${config.color}`}
                              >
                                {config.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-slate-500 flex-shrink-0">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-0 border-t border-slate-700/30 mt-2">
                            <div className="bg-slate-900/50 rounded p-3 mt-2">
                              <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-words">
                                {log.message}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-3 text-[10px] text-slate-500">
                                <span>ID: {log.id}</span>
                                <span>Bot: {log.botId}</span>
                                <span className="break-all">{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {filteredLogs.length > 15 && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full text-xs text-slate-400"
                  data-testid="button-show-more-logs"
                >
                  {showAll ? 'Show Less' : `Show All (${filteredLogs.length - 15} more)`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
