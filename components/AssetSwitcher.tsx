import React, { useState } from 'react';
import { ChevronDown, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Bot } from "@shared/schema";

interface AssetSwitcherProps {
  bot: Bot;
  onSymbolChange: (symbol: string) => void;
  onWatchlistUpdate: (watchlist: string[]) => void;
}

const POPULAR_PAIRS = [
  // Top Market Cap
  "BTC/USDT", "ETH/USDT", "BNB/USDT", "XRP/USDT", "SOL/USDT",
  "ADA/USDT", "DOGE/USDT", "TRX/USDT", "AVAX/USDT", "LINK/USDT",
  // DeFi & Layer 2
  "DOT/USDT", "MATIC/USDT", "UNI/USDT", "AAVE/USDT", "LDO/USDT",
  "ARB/USDT", "OP/USDT", "MKR/USDT", "INJ/USDT", "APT/USDT",
  // Meme Coins
  "SHIB/USDT", "PEPE/USDT", "WIF/USDT", "BONK/USDT", "FLOKI/USDT",
  // AI & Gaming
  "FET/USDT", "RNDR/USDT", "GRT/USDT", "IMX/USDT", "GALA/USDT",
  // Exchange Tokens
  "CRO/USDT", "LEO/USDT", "OKB/USDT", "KCS/USDT",
  // Other Trending
  "NEAR/USDT", "ATOM/USDT", "FTM/USDT", "ALGO/USDT", "VET/USDT",
  "HBAR/USDT", "ICP/USDT", "FIL/USDT", "SAND/USDT", "MANA/USDT",
  "LTC/USDT", "BCH/USDT", "ETC/USDT", "XLM/USDT", "XMR/USDT"
];

export default function AssetSwitcher({ bot, onSymbolChange, onWatchlistUpdate }: AssetSwitcherProps) {
  const [newPair, setNewPair] = useState('');
  const watchlist = bot.watchlist || ["BTC/USDT", "ETH/USDT", "SOL/USDT"];

  const handleAddPair = () => {
    if (newPair && !watchlist.includes(newPair.toUpperCase())) {
      const updated = [...watchlist, newPair.toUpperCase()];
      onWatchlistUpdate(updated);
      setNewPair('');
    }
  };

  const handleRemovePair = (pair: string) => {
    const updated = watchlist.filter(p => p !== pair);
    onWatchlistUpdate(updated);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-white/5 border-white/10 rounded-none h-10 px-4 hover:bg-white/10">
          <Star className="h-3 w-3 mr-2 text-primary" />
          <span className="font-display text-xs uppercase tracking-wider">{bot.symbol}</span>
          <ChevronDown className="h-3 w-3 ml-2 text-white/40" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-background/95 backdrop-blur border-white/10 rounded-none p-2">
        <p className="text-[9px] font-mono text-white/30 uppercase px-2 mb-2">Watchlist</p>
        {watchlist.map(pair => (
          <DropdownMenuItem 
            key={pair} 
            className="flex justify-between items-center rounded-none cursor-pointer"
            onClick={() => onSymbolChange(pair)}
          >
            <span className={`text-xs font-display ${pair === bot.symbol ? 'text-primary' : 'text-white/60'}`}>{pair}</span>
            {pair !== bot.symbol && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleRemovePair(pair); }}
                className="text-white/20 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator className="bg-white/5" />
        
        <p className="text-[9px] font-mono text-white/30 uppercase px-2 mb-2 mt-2">Popular ({POPULAR_PAIRS.length} Available)</p>
        <div className="grid grid-cols-3 gap-1 px-2 mb-2 max-h-48 overflow-y-auto">
          {POPULAR_PAIRS.filter(p => !watchlist.includes(p)).map(pair => (
            <button
              key={pair}
              onClick={() => onSymbolChange(pair)}
              className="text-[10px] font-mono text-white/40 hover:text-primary text-left py-1"
              data-testid={`button-pair-${pair.replace('/', '-')}`}
            >
              {pair.split('/')[0]}
            </button>
          ))}
        </div>

        <DropdownMenuSeparator className="bg-white/5" />
        
        <div className="flex gap-2 p-2">
          <Input 
            placeholder="Add pair..."
            value={newPair}
            onChange={(e) => setNewPair(e.target.value)}
            className="h-8 text-xs bg-white/5 border-white/10 rounded-none"
          />
          <Button 
            size="sm" 
            onClick={handleAddPair}
            className="h-8 px-2 bg-primary/10 text-primary hover:bg-primary hover:text-black rounded-none"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
