import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ExternalLink,
  RefreshCw,
  Filter,
  Zap,
  Globe,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  category: string;
  assets: string[];
  timestamp: string;
  source: string;
  importance: 'high' | 'medium' | 'low';
}

const sentimentColors = {
  bullish: 'text-green-400 bg-green-500/10 border-green-500/20',
  bearish: 'text-red-400 bg-red-500/10 border-red-500/20',
  neutral: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
};

const importanceColors = {
  high: 'bg-amber-500/20 text-amber-400',
  medium: 'bg-blue-500/20 text-blue-400',
  low: 'bg-slate-500/20 text-slate-400'
};

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { data: news = [], isLoading, refetch, isFetching } = useQuery<NewsArticle[]>({
    queryKey: ['/api/news'],
    refetchInterval: 60000,
  });

  const categories = ['all', 'market', 'regulation', 'technology', 'defi', 'adoption'];
  
  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(n => n.category.toLowerCase() === selectedCategory);

  const bullishCount = news.filter(n => n.sentiment === 'bullish').length;
  const bearishCount = news.filter(n => n.sentiment === 'bearish').length;
  const neutralCount = news.filter(n => n.sentiment === 'neutral').length;

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-3">
            <Newspaper className="h-6 w-6 text-primary" />
            Crypto News
          </h1>
          <p className="text-sm text-white/40 mt-1">AI-curated news and market insights</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-white/10"
          data-testid="button-refresh-news"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Total Stories</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-total-stories">{news.length}</p>
              </div>
              <Newspaper className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Bullish</p>
                <p className="text-2xl font-bold mt-1 text-green-400" data-testid="text-bullish-count">{bullishCount}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Bearish</p>
                <p className="text-2xl font-bold mt-1 text-red-400" data-testid="text-bearish-count">{bearishCount}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Neutral</p>
                <p className="text-2xl font-bold mt-1 text-slate-400" data-testid="text-neutral-count">{neutralCount}</p>
              </div>
              <Globe className="h-8 w-8 text-slate-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className={selectedCategory !== cat ? "border-white/10 text-white/60" : ""}
            data-testid={`button-filter-${cat}`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Latest Headlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <span className="ml-3 text-white/40">Loading news...</span>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No news articles available</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <AnimatePresence>
                <div className="space-y-4">
                  {filteredNews.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-lg bg-slate-900/50 border border-white/5 hover:border-white/10 transition-all"
                      data-testid={`card-news-${article.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${importanceColors[article.importance]} text-[10px] uppercase`}>
                              {article.importance === 'high' && <Zap className="h-3 w-3 mr-1" />}
                              {article.importance}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] uppercase border-white/10">
                              {article.category}
                            </Badge>
                            <Badge className={`${sentimentColors[article.sentiment]} border text-[10px] uppercase`}>
                              {article.sentiment === 'bullish' && <TrendingUp className="h-3 w-3 mr-1" />}
                              {article.sentiment === 'bearish' && <TrendingDown className="h-3 w-3 mr-1" />}
                              {article.sentiment}
                            </Badge>
                          </div>
                          
                          <h3 className="font-medium text-white/90 mb-2">{article.title}</h3>
                          <p className="text-sm text-white/50 leading-relaxed">{article.summary}</p>
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-white/30">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(article.timestamp)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {article.source}
                            </span>
                          </div>
                          
                          {article.assets.length > 0 && (
                            <div className="flex gap-1 mt-3">
                              {article.assets.map(asset => (
                                <Badge 
                                  key={asset} 
                                  variant="outline" 
                                  className="text-[9px] border-primary/30 text-primary/70"
                                >
                                  {asset}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Market Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 bg-slate-900 rounded-full overflow-hidden">
              <div className="flex h-full">
                <div 
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${news.length > 0 ? (bullishCount / news.length) * 100 : 0}%` }}
                />
                <div 
                  className="bg-slate-500 transition-all duration-500"
                  style={{ width: `${news.length > 0 ? (neutralCount / news.length) * 100 : 0}%` }}
                />
                <div 
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${news.length > 0 ? (bearishCount / news.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {news.length > 0 
                  ? bullishCount > bearishCount 
                    ? 'Bullish Bias' 
                    : bearishCount > bullishCount 
                      ? 'Bearish Bias' 
                      : 'Mixed Sentiment'
                  : 'No Data'}
              </p>
              <p className="text-xs text-white/40">Based on {news.length} articles</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
