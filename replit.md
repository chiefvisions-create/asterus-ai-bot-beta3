# Astraeus AI - Crypto Trading Terminal

## Overview

Astraeus AI is an AI-driven cryptocurrency day-trading bot dashboard built as a full-stack TypeScript application. The system provides a production-style trading terminal with real-time monitoring, risk management controls, and multi-exchange support via CCXT. The application operates in Paper Trading mode by default with explicit safeguards required for live trading.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, with automatic refetching for real-time data
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom theme variables for a dark terminal aesthetic
- **Animations**: Framer Motion for UI transitions

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API under `/api` prefix
- **Trading Engine**: Singleton pattern for bot lifecycle management
- **Exchange Integration**: CCXT library for Coinbase and Kraken APIs

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines tables for bots, trades, and logs
- **Migrations**: Drizzle Kit for schema push (`npm run db:push`)

### Key Design Decisions

1. **Singleton Bot Pattern**: The trading engine uses a singleton to ensure only one bot instance runs, preventing duplicate trades
2. **Paper/Live Mode Toggle**: Live trading requires explicit user confirmation to prevent accidental real trades
3. **Shared Schema**: TypeScript types are shared between client and server via `@shared/*` path alias
4. **Real-time Polling**: Trade and log data refresh automatically via React Query intervals rather than WebSockets

### Speed Optimizations for Day Trading (Live Mode)

1. **Fast Signal Generation**: Ultra-fast signals using ROC (Rate of Change), VWAP, and momentum scoring for sub-second decision making
2. **Parallel Data Fetching**: Market intelligence, adaptive confidence, and fast signals fetched in parallel using Promise.all
3. **Reduced AI Cache**: 1-minute cache (down from 5 minutes) for fresher market intelligence
4. **Fast Scalping Signals**: Rule-based instant signals with 3-second AI timeout fallback
5. **Fast Signal Override**: High-confidence fast signals (75%+) can trigger entries with minimum score of 3 in live mode
6. **Momentum Detection**: Multi-timeframe ROC (3, 5, 10 periods) with volume confirmation

### Institutional Quantitative Trading Methods

1. **VPIN (Volume-Synchronized Probability of Informed Trading)**: Detects toxic/informed order flow to predict volatility spikes
2. **Order Flow Imbalance**: Measures buyer vs seller aggression from order book depth, detects bid/ask walls
3. **Cumulative Delta Analysis**: Tracks buyer vs seller aggression over time, identifies accumulation/distribution and price divergences
4. **Z-Score Mean Reversion**: Statistical arbitrage signal for oversold/overbought conditions with probability-based entries
5. **Multi-Timeframe Confluence**: Weighted analysis across 5m, 15m, 1hr, 4hr timeframes (4hr=4 weight, 1hr=3, 15m=2, 5m=1)
6. **Institutional Trading Hours Optimization**: Detects optimal trading windows (US session 9-11 AM EST peak ETF activity)
7. **Absorption/Exhaustion Pattern Detection**: Identifies reversal patterns through volume analysis at key levels
8. **Kelly Criterion Position Sizing**: Optimal position sizing based on win rate and average win/loss ratio with fractional Kelly for safety

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database operations

### Exchange APIs
- **CCXT**: Unified cryptocurrency exchange library
- Supports Coinbase and Kraken exchanges
- API keys stored in bot configuration (database)

### UI Framework Dependencies
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons

### Build & Development
- Vite for frontend bundling
- esbuild for server bundling
- TypeScript for type safety across the stack