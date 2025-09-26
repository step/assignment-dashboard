import { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";

const SECRET_MESSAGE = Deno.env.get("SECRET_MESSAGE") || "default-secret";
const SESSION_COOKIE_NAME = "auth-session";
const SESSION_EXPIRY_DAYS = 700;

export const handleLogin = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { secretMessage } = body;

    if (!secretMessage) {
      return c.json({ error: "Secret message is required" }, 400);
    }

    if (secretMessage !== SECRET_MESSAGE) {
      return c.json({ error: "Invalid secret message" }, 401);
    }

    // Create a simple session token (in production, use proper JWT or session management)
    const sessionToken = generateSessionToken();

    // Set secure cookie
    setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: c.req.url.startsWith("https://"),
      sameSite: "Strict",
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return c.json({ success: true, message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Invalid request" }, 400);
  }
};

export const handleLogout = (c: Context) => {
  setCookie(c, SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: c.req.url.startsWith("https://"),
    sameSite: "Strict",
    maxAge: 0, // Expire immediately
    path: "/",
  });

  return c.json({ success: true, message: "Logged out successfully" });
};

export const checkAuthStatus = (c: Context) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  const isAuthenticated = isValidSession(sessionToken);

  return c.json({ authenticated: isAuthenticated });
};

export const requireAuth = async (c: Context, next: () => Promise<void>) => {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);

  if (!isValidSession(sessionToken)) {
    // If it's an API request, return JSON error
    if (c.req.url.includes("/api/")) {
      return c.json({ error: "Authentication required" }, 401);
    }
    // For HTML pages, redirect to login
    return c.redirect("/login");
  }

  await next();
};

function generateSessionToken(): string {
  // Simple token generation - in production, use crypto.randomUUID() or proper JWT
  const timestamp = Date.now().toString();
  const randomStr = Math.random().toString(36).substring(2);
  return `${timestamp}-${randomStr}`;
}

function isValidSession(sessionToken?: string): boolean {
  if (!sessionToken) {
    return false;
  }

  // Simple validation - in production, validate JWT or check against session store
  const parts = sessionToken.split("-");
  if (parts.length !== 2) {
    return false;
  }

  const timestamp = parseInt(parts[0]);
  const maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const isExpired = (Date.now() - timestamp) > maxAge;

  return !isExpired;
}
