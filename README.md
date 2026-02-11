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

## How to use
1. **Explore the Terminal**: View your current equity, open positions, and system logs.
2. **Start the Bot**: Click the **"START BOT"** button to initiate the trading loop.
3. **Live Trading**: Toggle the "Live" mode switch. You will be prompted to type "confirm live" to acknowledge the risks of production trading.
4. **Adjust Risk**: Use the Risk Protocol panel to set your safety parameters.

## Moving to Production
To make this bot functional with real exchanges:
1. **Graduate to Full-Stack**: Convert this prototype to a full-stack Replit app.
2. **Exchange Integration**: Use the `CCXT` library in the backend to connect to Binance, Coinbase, or Kraken.
3. **Secure Secrets**: Store your API Key and Secret using Replit's **Secrets** tool.
4. **Persistent State**: Use the integrated SQLite database to store trade history and bot settings.
