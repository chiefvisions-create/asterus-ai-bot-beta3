import type { Express, Request, Response } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Shared handler for getting current authenticated user
async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    // With Auth0, user info is in req.oidc.user
    const userId = (req as any).oidc?.user?.sub;
    if (!userId) {
      res.status(401).json({ message: "User ID not found" });
      return;
    }
    const user = await authStorage.getUser(userId);
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, getCurrentUser);

  // Get current authenticated user (alias for /api/auth/user)
  app.get("/api/me", isAuthenticated, getCurrentUser);
}
