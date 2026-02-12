import { auth, requiresAuth } from "express-openid-connect";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import memorystore from "memorystore";
import * as crypto from "crypto";

async function upsertUserFromAuth0(userInfo: any) {
  // Auth0 user info has a different structure than Replit
  // Map Auth0 user info to our database schema
  await authStorage.upsertUser({
    id: userInfo.sub, // Auth0 user ID
    email: userInfo.email,
    firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || '',
    lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '',
    profileImageUrl: userInfo.picture,
  });
}

export async function setupAuth(app: Express) {
  // Check if Auth0 credentials are configured
  const hasAuth0Config = !!(
    process.env.AUTH0_ISSUER_BASE_URL &&
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_CLIENT_SECRET
  );

  if (!hasAuth0Config) {
    console.warn("⚠️  Auth0 credentials not set - authentication will be disabled.");
    console.warn("    Required environment variables:");
    console.warn("    - AUTH0_SECRET");
    console.warn("    - AUTH0_BASE_URL (your app's URL)");
    console.warn("    - AUTH0_ISSUER_BASE_URL (your Auth0 tenant URL)");
    console.warn("    - AUTH0_CLIENT_ID");
    console.warn("    - AUTH0_CLIENT_SECRET");
    console.warn("    For Railway deployments, add these to your environment variables.");
    
    // Setup minimal session management without auth
    app.set("trust proxy", 1);
    
    // Generate or use SESSION_SECRET
    let sessionSecret = process.env.SESSION_SECRET || process.env.AUTH0_SECRET;
    if (!sessionSecret) {
      if (process.env.NODE_ENV === 'production') {
        sessionSecret = crypto.randomBytes(32).toString('hex');
        console.warn("⚠️  SESSION_SECRET not set in production. Generated a random secret.");
      } else {
        sessionSecret = 'dev-secret-change-before-production';
      }
    }
    
    const MemoryStore = memorystore(session);
    app.use(session({
      secret: sessionSecret,
      store: new MemoryStore({
        checkPeriod: 86400000
      }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }));
    
    return;
  }
  
  // Auth0 is configured - set up authentication
  app.set("trust proxy", 1);
  
  // Get or generate AUTH0_SECRET
  let auth0Secret = process.env.AUTH0_SECRET;
  if (!auth0Secret) {
    if (process.env.NODE_ENV === 'production') {
      auth0Secret = crypto.randomBytes(32).toString('hex');
      console.warn("⚠️  AUTH0_SECRET not set. Generated a random secret.");
      console.warn("    Set AUTH0_SECRET environment variable for multi-instance deployments.");
    } else {
      auth0Secret = 'dev-secret-change-before-production';
    }
  }

  // Configure Auth0
  const config = {
    authRequired: false, // We'll handle auth per route
    auth0Logout: true,
    secret: auth0Secret,
    baseURL: process.env.AUTH0_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
    clientID: process.env.AUTH0_CLIENT_ID!,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    authorizationParams: {
      response_type: 'code',
      scope: 'openid profile email',
    },
    routes: {
      login: '/api/login',
      logout: '/api/logout',
      callback: '/api/callback',
      postLogoutRedirect: '/',
    },
    session: {
      rolling: true,
      rollingDuration: 7 * 24 * 60 * 60, // 1 week in seconds
      store: process.env.DATABASE_URL 
        ? (() => {
            const pgStore = connectPg(session);
            return new pgStore({
              conString: process.env.DATABASE_URL,
              createTableIfMissing: false,
              ttl: 7 * 24 * 60 * 60, // 1 week in seconds
              tableName: "sessions",
            }) as any; // Type cast: connect-pg-simple Store is compatible but has different type signature
          })()
        : undefined, // Use default memory store if no DATABASE_URL
    },
  } as any; // Type cast: ConfigParams type from express-openid-connect has stricter session store typing

  app.use(auth(config));

  // Middleware to sync Auth0 user to our database
  app.use(async (req: any, res, next) => {
    if (req.oidc?.isAuthenticated() && req.oidc.user) {
      try {
        await upsertUserFromAuth0(req.oidc.user);
      } catch (error) {
        console.error("Failed to sync user to database:", error);
      }
    }
    next();
  });

  console.log("✅ Auth0 authentication configured successfully");
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  // Check if Auth0 is configured and user is authenticated
  if (req.oidc?.isAuthenticated && req.oidc.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};
