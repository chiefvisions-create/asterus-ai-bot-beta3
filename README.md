# Astraeus AI - Crypto Trading Terminal

## Overview
Astraeus AI is a high-performance, AI-driven crypto day-trading bot dashboard. This prototype demonstrates a production-style terminal with robust risk controls, real-time monitoring (mocked), and a secure transition between paper and live trading.

## Core Features (Mockup)
- **Multi-Mode Operation**: Default Paper Trading mode for strategy validation.
- **Production Guardrails**: "Live" mode requires an explicit toggle and typed confirmation.
- **Risk Management**:
  - Max Position Size per trade.
  - Max Daily Loss circuit breaker.
  - Orders-per-hour throttle.
  - Emergency Kill Switch.
- **Observability**: Structured system logs, recent trade history, and real-time equity tracking.
- **Notifications**: Discord/Slack webhook integration (mocked).

## Deployment

### Railway Deployment

Deploy this app to Railway with PostgreSQL database support. See [RAILWAY.md](./RAILWAY.md) for detailed instructions.

Quick start:
1. Create a new Railway project from this GitHub repo
2. Add a PostgreSQL database service
3. Railway will automatically set `DATABASE_URL`
4. Deploy!

### Local Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up environment variables (see RAILWAY.md for required vars)
4. Run database migrations: `npm run db:push`
5. Start development server: `npm run dev`

## How to use
1. **Explore the Terminal**: View your current equity, open positions, and system logs.
2. **Start the Bot**: Click the **"START BOT"** button to initiate the trading loop.
3. **Live Trading**: Toggle the "Live" mode switch. You will be prompted to type "confirm live" to acknowledge the risks of production trading.
4. **Adjust Risk**: Use the Risk Protocol panel to set your safety parameters.

## Moving to Production
To make this bot functional with real exchanges:
1. **Deploy to Railway**: Follow the [Railway deployment guide](./RAILWAY.md) for production hosting.
2. **Exchange Integration**: Use the `CCXT` library in the backend to connect to Binance, Coinbase, or Kraken.
3. **Secure Secrets**: Store your API Key and Secret using Railway environment variables.
4. **Persistent State**: PostgreSQL database stores trade history and bot settings.
