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

### Authentication (Required for Auth0)

All five variables below are required for Auth0 authentication to work:

- **`AUTH0_SECRET`** - Random secret for session encryption
  - Generate with: `openssl rand -base64 32` (recommended) or `openssl rand -hex 32`
  - ⚠️ **Keep secure, never commit to git**
  
- **`AUTH0_BASE_URL`** - Your application's base URL
  - Example: `https://your-app.railway.app`
  - Used for Auth0 callback redirects
  
- **`AUTH0_ISSUER_BASE_URL`** - Your Auth0 tenant URL
  - Format: `https://your-tenant.auth0.com` or `https://your-tenant.us.auth0.com`
  - Example: `https://dev-ejjwtoxn7b3krvga.us.auth0.com`
  
- **`AUTH0_CLIENT_ID`** - Auth0 application client ID
  - Public identifier for your Auth0 application
  
- **`AUTH0_CLIENT_SECRET`** - Auth0 application client secret
  - ⚠️ **MUST be set as Railway environment variable - NEVER commit to repository**
  - ⚠️ **If exposed**, rotate immediately in Auth0 Dashboard (Applications → Settings → Rotate Client Secret)

**Note:** If Auth0 credentials are not provided, the application will start without authentication enabled. When users attempt to access `/api/login`, they will receive a clear message indicating that authentication is not configured along with the list of required environment variables.

### Optional Configuration

- **`SESSION_SECRET`** - (Deprecated: use AUTH0_SECRET instead) Secret key for session management
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

### 4. Configure Auth0 (Required for Authentication)

This project uses Auth0 for secure user authentication. Follow these steps to configure Auth0 for your Railway deployment:

#### Prerequisites

**Auth0 Application Details for this Project:**
- **Auth0 Domain**: `dev-ejjwtoxn7b3krvga.us.auth0.com`
- **Client ID**: `ME9UbyrFx2l029rW8Ai9asSC4T62k2Ao`
- **Client Secret**: Contact the project admin for this value (⚠️ **NEVER commit to git**)

#### Step 1: Configure Auth0 Application Settings

After deploying your Railway app, you'll receive a Railway URL (e.g., `https://your-app.railway.app`). Use this URL to configure your Auth0 application:

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to: **Applications** → Select the application with Client ID `ME9UbyrFx2l029rW8Ai9asSC4T62k2Ao` → **Settings**
3. Update the following fields (replace `your-app` with your actual Railway subdomain):
   - **Allowed Callback URLs**: `https://your-app.railway.app/api/callback`
   - **Allowed Logout URLs**: `https://your-app.railway.app`
   - **Allowed Web Origins**: `https://your-app.railway.app`
4. Click **Save Changes**

#### Step 2: Set Environment Variables in Railway

In your Railway project, go to the **Variables** tab and add the following environment variables:

**Required Auth0 Variables:**

- **`AUTH0_ISSUER_BASE_URL`**
  - Value: `https://dev-ejjwtoxn7b3krvga.us.auth0.com`
  - Description: Your Auth0 tenant domain

- **`AUTH0_CLIENT_ID`**
  - Value: `ME9UbyrFx2l029rW8Ai9asSC4T62k2Ao`
  - Description: Auth0 application client ID (public identifier)

- **`AUTH0_CLIENT_SECRET`**
  - Value: Contact project admin for this value
  - Description: Auth0 application client secret
  - ⚠️ **CRITICAL**: Set this ONLY in Railway environment variables, NEVER commit to git
  - ⚠️ **If Exposed**: If this secret is accidentally exposed, rotate it immediately:
    - Go to Auth0 Dashboard → Applications → [Your App] → Settings
    - Click **Rotate** next to Client Secret
    - Update the Railway environment variable with the new secret
    - Redeploy your application

- **`AUTH0_SECRET`**
  - Value: Generate a secure random string using:
    ```bash
    openssl rand -base64 32
    ```
    or
    ```bash
    openssl rand -hex 32
    ```
  - Description: Secret for session encryption
  - ⚠️ Keep this secret secure and never commit it to version control

- **`AUTH0_BASE_URL`**
  - Value: `https://your-app.railway.app` (replace with your actual Railway URL)
  - Description: Your application's public URL for Auth0 callbacks

#### Step 3: Redeploy
   - After adding the environment variables, Railway will automatically redeploy
   - Authentication will now be enabled

### 5. Configure Environment Variables (Optional)

Add any additional environment variables you need:

1. Go to your app service in Railway
2. Click on the "Variables" tab
3. Add variables like `AI_INTEGRATIONS_OPENAI_API_KEY` if you want AI features

### 6. Deploy

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

If authentication is not working:

1. **Check Auth0 Configuration**
   - Verify all Auth0 environment variables are set correctly
   - Ensure callback URLs match exactly (including protocol: `https://`)
   - Check Auth0 application logs for any errors

2. **Missing Environment Variables**
   - If Auth0 variables are not set, the app will log a warning:
     ```
     ⚠️  Auth0 credentials not set - authentication will be disabled.
     ```
   - This is expected if you haven't configured Auth0 yet
   - When users click the login button, they will receive a JSON response explaining that authentication is not configured and listing the required environment variables
   - The app will work without authentication, but protected routes will return 401

3. **Session Issues**
   - Ensure `AUTH0_SECRET` is set and consistent across deployments
   - For multiple instances, all instances must use the same `AUTH0_SECRET`
   - Check that `DATABASE_URL` is set for persistent session storage

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
