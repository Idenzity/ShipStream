
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


const allowedStatuses = ["Pending", "Processing", "In Transit", "Out for Delivery", "Delivered", "Delayed", "Cancelled"];

// List shipments owned by the logged-in user.
app.get("/api/shipments", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("user_id", req.auth.sub)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({ shipments: data });
  } catch (error) {
    console.error("List shipments error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve shipments.",
    });
  }
});

// Create a shipment for the logged-in user.
app.post("/api/shipments", requireAuth, async (req, res) => {
  try {
    const {
      furnitureName,
      description,
      recipientName,
      deliveryAddress,
      carrier,
      trackingNumber,
      estimatedDelivery,
    } = req.body || {};

    if (
      typeof furnitureName !== "string" ||
      typeof recipientName !== "string" ||
      typeof deliveryAddress !== "string"
    ) {
      return res.status(400).json({
        message: "Furniture name, recipient, and delivery address are required.",
      });
    }

    const cleanFurnitureName = furnitureName.trim();
    const cleanRecipientName = recipientName.trim();
    const cleanAddress = deliveryAddress.trim();

    if (
      !cleanFurnitureName ||
      cleanFurnitureName.length > 150 ||
      !cleanRecipientName ||
      cleanRecipientName.length > 150 ||
      !cleanAddress ||
      cleanAddress.length > 500
    ) {
      return res.status(400).json({
        message: "Please check the required fields and their lengths.",
      });
    }

    if (
      description !== undefined &&
      (typeof description !== "string" || description.length > 1000)
    ) {
      return res.status(400).json({
        message: "Description must be 1000 characters or fewer.",
      });
    }

    if (
      carrier !== undefined &&
      (typeof carrier !== "string" || carrier.trim().length > 100)
    ) {
      return res.status(400).json({
        message: "Carrier must be 100 characters or fewer.",
      });
    }

    if (
      trackingNumber !== undefined &&
      (typeof trackingNumber !== "string" ||
        trackingNumber.trim().length > 150)
    ) {
      return res.status(400).json({
        message: "Tracking number must be 150 characters or fewer.",
      });
    }

    let cleanEstimatedDelivery = null;

    if (estimatedDelivery) {
      if (
        typeof estimatedDelivery !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(estimatedDelivery)
      ) {
        return res.status(400).json({
          message: "Estimated delivery must be a valid date.",
        });
      }

      const date = new Date(`${estimatedDelivery}T00:00:00.000Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== estimatedDelivery
      ) {
        return res.status(400).json({
          message: "Estimated delivery must be a valid date.",
        });
      }

      cleanEstimatedDelivery = estimatedDelivery;
    }

    const { data, error } = await supabase
      .from("shipments")
      .insert({
        user_id: req.auth.sub,
        furniture_name: cleanFurnitureName,
        description: (description || "").trim(),
        recipient_name: cleanRecipientName,
        delivery_address: cleanAddress,
        carrier: (carrier || "Not assigned").trim() || "Not assigned",
        tracking_number: (trackingNumber || "").trim() || null,
        estimated_delivery: cleanEstimatedDelivery,
        status: "Pending",
      })
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({
      message: "Shipment created successfully.",
      shipment: data,
    });
  } catch (error) {
    console.error("Create shipment error:", error.message);

    return res.status(500).json({
      message: "Unable to create shipment.",
    });
  }
});

// Get one shipment, but only if the logged-in user owns it.
app.get("/api/shipments/:id", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.auth.sub)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        message: "Shipment not found.",
      });
    }

    return res.json({ shipment: data });
  } catch (error) {
    console.error("Get shipment error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve shipment.",
    });
  }
});

// Delete a shipment owned by the logged-in user.
app.delete("/api/shipments/:id", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("shipments")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.auth.sub)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        message: "Shipment not found.",
      });
    }

    return res.json({
      message: "Shipment deleted successfully.",
    });
  } catch (error) {
    console.error("Delete shipment error:", error.message);

    return res.status(500).json({
      message: "Unable to delete shipment.",
    });
  }
});


// Handle invalid API routes.
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

app.listen(PORT, () => {
  console.log(`ShipStream API running on http://localhost:${PORT}`);
});
