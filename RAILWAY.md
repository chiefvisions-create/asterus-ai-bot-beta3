# Railway Deployment Guide

This guide explains how to deploy the Astraeus AI trading bot to Railway.

## Prerequisites

1. A [Railway](https://railway.app) account
2. A GitHub account with access to this repository

## Required Environment Variables

The following environment variables must be configured in your Railway project:

### Database (Required)

- **`DATABASE_URL`** - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Railway will automatically provide this when you add a PostgreSQL database service

### Optional Configuration

- **`SESSION_SECRET`** - Secret key for session management (auto-generated if not provided)
- **`AI_INTEGRATIONS_OPENAI_API_KEY`** - OpenAI API key for AI-powered trading features
- **`AI_INTEGRATIONS_OPENAI_BASE_URL`** - Custom OpenAI API base URL (optional)
- **`PORT`** - Server port (Railway sets this automatically, default: 5000)
- **`NODE_ENV`** - Set to `production` for production deployments

### Exchange API Keys (Optional - for live trading)

- **`COINBASE_API_KEY`** - Coinbase Pro API key
- **`COINBASE_API_SECRET`** - Coinbase Pro API secret
- **`KRAKEN_API_KEY`** - Kraken API key
- **`KRAKEN_API_SECRET`** - Kraken API secret

## Deployment Steps

### 1. Create a New Project on Railway

1. Go to [Railway](https://railway.app) and log in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository
5. Railway will automatically detect the Node.js app and start the deployment

### 2. Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically:
   - Create a PostgreSQL database
   - Set the `DATABASE_URL` environment variable
   - Link the database to your app

### 3. Run Database Migrations

After the database is connected, you need to create the database schema:

1. Go to your app service in Railway
2. Open the "Settings" tab
3. Add a new environment variable:
   - Name: `RAILWAY_RUN_BUILD_COMMAND`
   - Value: `npm run build && npm run db:push`

Or manually run migrations after deployment:

```bash
railway run npm run db:push
```

### 4. Configure Environment Variables (Optional)

Add any additional environment variables you need:

1. Go to your app service in Railway
2. Click on the "Variables" tab
3. Add variables like `AI_INTEGRATIONS_OPENAI_API_KEY` if you want AI features

### 5. Deploy

Railway will automatically deploy your app. The deployment process:

1. Installs dependencies using `npm ci`
2. Builds the app using `npm run build`
3. Starts the server using `npm start`

## Build and Start Commands

Railway uses these npm scripts from `package.json`:

- **Build**: `npm run build` - Compiles TypeScript and bundles the application
- **Start**: `npm start` - Runs the production server on `NODE_ENV=production`

## Health Check

Once deployed, you can verify your app is running by visiting the Railway-provided URL. You should see the Astraeus AI dashboard.

## Troubleshooting

### Build Fails with `npm ci` Error

If you see errors about package-lock.json being out of sync:

1. Ensure your local `package-lock.json` is committed to git
2. Try deleting and regenerating: `rm -rf node_modules package-lock.json && npm install`
3. Commit and push the updated `package-lock.json`

### App Crashes with "DATABASE_URL must be set"

This means the PostgreSQL database isn't connected:

1. Verify you've added a PostgreSQL database service
2. Check that `DATABASE_URL` appears in the Variables tab
3. Restart the deployment

### Database Connection Fails

If the database connects but queries fail:

1. Run the database migrations: `railway run npm run db:push`
2. Check the database credentials are correct
3. Verify the database is running and accessible

### Authentication Not Working

Railway deployments don't support Replit authentication. You'll see a warning:

```
⚠️  REPL_ID not set - skipping Replit authentication setup.
```

This is expected. The app will work without authentication, or you can implement alternative auth methods.

## Monitoring and Logs

1. View logs in real-time from the Railway dashboard
2. Click on your app service → "Deployments" → Select a deployment → "View Logs"
3. Logs will show:
   - Server startup messages
   - Database connection status
   - Trading bot activity
   - Any errors or warnings

## Scaling

Railway provides automatic scaling. For production workloads:

1. Upgrade to a paid plan for better resources
2. Configure auto-scaling in the project settings
3. Monitor performance in the Railway dashboard

## Security Notes

- Never commit API keys or secrets to git
- Use Railway's environment variables for all sensitive data
- Enable 2FA on your Railway account
- Regularly rotate API keys and database passwords
- Review Railway's security best practices: https://docs.railway.app/reference/security

## Support

For Railway-specific issues:
- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

For app-specific issues, refer to the main README.md or open an issue on GitHub.
