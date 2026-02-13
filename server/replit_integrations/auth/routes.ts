import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Shared handler for getting current authenticated user
async function getCurrentUser(req: any, res: any): Promise<void> {
  try {
    // With Auth0, user info is in req.oidc.user
    const userId = req.oidc?.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
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
