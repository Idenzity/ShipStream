
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5000;

const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "JWT_SECRET",
  "FRONTEND_URL",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters.");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

const isProduction = process.env.NODE_ENV === "production";
const cookieName = "shipstream_token";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};

function createToken(user) {
  return jwt.sign(
    { sub: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function setAuthCookie(res, user) {
  res.cookie(cookieName, createToken(user), cookieOptions);
}

function requireAuth(req, res, next) {
  const token = req.cookies[cookieName];

  if (!token) {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      message: "Your session is invalid or expired. Please log in again.",
    });
  }
}

// Check whether the backend is running.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "ShipStream API" });
});

// Register a new user.
app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword } =
      req.body || {};

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return res.status(400).json({
        message: "Please provide all required fields.",
      });
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        message: "Full name must be between 2 and 100 characters.",
      });
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (cleanPhone.length < 7 || cleanPhone.length > 25) {
      return res.status(400).json({
        message: "Please enter a valid phone number.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must be between 8 and 72 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: user, error: insertError } = await supabase
      .from("users")
      .insert({
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password_hash: passwordHash,
      })
      .select("id, full_name, email, phone, created_at")
      .single();

    if (insertError) {
      // Also handles a duplicate email if two requests arrive together.
      if (insertError.code === "23505") {
        return res.status(409).json({
          message: "An account with this email already exists.",
        });
      }

      throw insertError;
    }

    setAuthCookie(res, user);

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Unable to create your account right now.",
    });
  }
});

// Log in an existing user.
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, phone, password_hash")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      throw error;
    }

    const passwordMatches =
      user && (await bcrypt.compare(password, user.password_hash));

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    setAuthCookie(res, user);

    return res.json({
      message: "Login successful.",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in right now.",
    });
  }
});

// Return the currently logged-in user.
app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, phone, created_at")
      .eq("id", req.auth.sub)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!user) {
      res.clearCookie(cookieName, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
      });

      return res.status(401).json({
        message: "User account not found.",
      });
    }

    return res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("User lookup error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve your account.",
    });
  }
});

// Log out by clearing the authentication cookie.
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });

  return res.json({ message: "Logged out successfully." });
});

// Handle invalid API routes.
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

app.listen(PORT, () => {
  console.log(`ShipStream API running on http://localhost:${PORT}`);
});