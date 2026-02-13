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

#### Prerequisites
- Node.js 20+ installed
- PostgreSQL database (local or remote)
- Auth0 account (for authentication) - optional for initial testing

#### Setup Steps

1. **Clone this repository**
   ```bash
   git clone <repository-url>
   cd asterus-ai-bot-beta3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure the required variables:
   
   **Required:**
   - `DATABASE_URL` - PostgreSQL connection string
   
   **Required for Authentication:**
   - `AUTH0_SECRET` - Random secret for session encryption (generate with `openssl rand -base64 32`)
   - `AUTH0_BASE_URL` - Your app's URL (e.g., `http://localhost:5000`)
   - `AUTH0_ISSUER_BASE_URL` - Your Auth0 tenant URL (e.g., `https://your-tenant.auth0.com`)
   - `AUTH0_CLIENT_ID` - Auth0 application client ID
   - `AUTH0_CLIENT_SECRET` - Auth0 application client secret
   
   See [RAILWAY.md](./RAILWAY.md) section "Configure Auth0" for detailed Auth0 setup instructions.
   
   **Note:** If Auth0 credentials are not configured, the app will start without authentication. You'll see a warning message in the console, and `/api/login` will return information about the missing configuration.

4. **Set up Auth0 (for authentication)**
   
   This project is pre-configured with an Auth0 application. Follow these steps:
   
   a. **For Local Development:**
      - Use the provided Auth0 tenant: `dev-ejjwtoxn7b3krvga.us.auth0.com`
      - Client ID: `ME9UbyrFx2l029rW8Ai9asSC4T62k2Ao`
   
   b. **Configure Auth0 Application Settings:**
      - In Auth0 Dashboard, navigate to the application with the above Client ID
      - Add to the application settings:
        - **Allowed Callback URLs**: `http://localhost:5000/api/callback`
        - **Allowed Logout URLs**: `http://localhost:5000`
        - **Allowed Web Origins**: `http://localhost:5000`
   
   c. **Set your local environment variables in `.env`:**
      - `AUTH0_ISSUER_BASE_URL`: `https://dev-ejjwtoxn7b3krvga.us.auth0.com`
      - `AUTH0_CLIENT_ID`: `ME9UbyrFx2l029rW8Ai9asSC4T62k2Ao`
      - `AUTH0_CLIENT_SECRET`: Contact the project admin for the client secret value
   
   **Alternative:** You can also create your own Auth0 application if you prefer. See [RAILWAY.md](./RAILWAY.md) for detailed Auth0 setup instructions.

5. **Run database migrations**
   ```bash
   npm run db:push
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5000`

#### Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema changes

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
