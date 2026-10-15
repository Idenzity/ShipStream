require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

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

app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buffer) => {
      if (req.originalUrl === "/api/webhooks/paymongo") {
        req.rawBody = Buffer.from(buffer);
      }
    },
  })
);

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

// Shipment status options.
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

app.post(
  "/api/shipments/:id/register-tracking",
  requireAuth,
  async (req, res) => {
    try {
      const trackingToken = process.env.TRACK17_API_TOKEN;

      if (!trackingToken) {
        return res.status(500).json({
          message: "17TRACK is not configured on the server.",
        });
      }

      // Retrieve only a shipment owned by this user.
      const { data: shipment, error: shipmentError } =
        await supabase
          .from("shipments")
          .select("*")
          .eq("id", req.params.id)
          .eq("user_id", req.auth.sub)
          .maybeSingle();

      if (shipmentError) throw shipmentError;

      if (!shipment) {
        return res.status(404).json({
          message: "Shipment not found.",
        });
      }

      if (!shipment.tracking_number) {
        return res.status(400).json({
          message: "This shipment has no tracking number.",
        });
      }

      // Register with 17TRACK. Leave carrier detection automatic.
      const apiResponse = await fetch(
        "https://api.17track.net/track/v2.4/register",
        {
          method: "POST",
          headers: {
            "17token": trackingToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              number: shipment.tracking_number,
            },
          ]),
        }
      );

      const result = await apiResponse.json();

      
if (!apiResponse.ok || result.code !== 0) {
  console.error("17TRACK HTTP status:", apiResponse.status);
  console.error(
    "17TRACK response:",
    JSON.stringify(result, null, 2)
  );

  return res.status(502).json({
    message: "17TRACK registration failed. Check backend logs.",
  });
}


      const accepted = result.data?.accepted || [];
      const rejected = result.data?.rejected || [];

      const registered = accepted.some(
        (item) => item.number === shipment.tracking_number
      );

      if (!registered) {
        const rejection = rejected.find(
          (item) => item.number === shipment.tracking_number
        );

        return res.status(422).json({
          message:
            rejection?.error?.message ||
            "17TRACK did not accept this tracking number.",
        });
      }

      // Save the tracking provider. The shipment status will be
      // updated later when we process actual tracking updates.
      const { error: updateError } = await supabase
        .from("shipments")
        .update({
          carrier: "17TRACK",
          updated_at: new Date().toISOString(),
        })
        .eq("id", shipment.id)
        .eq("user_id", req.auth.sub);

      if (updateError) throw updateError;

      return res.json({
        message: "Tracking number registered with 17TRACK.",
        trackingNumber: shipment.tracking_number,
      });
    } catch (error) {
      console.error("17TRACK registration error:", error.message);

      return res.status(500).json({
        message: "Unable to register tracking number.",
      });
    }
  }
);

app.post(
  "/api/shipments/:id/mock-advance",
  requireAuth,
  async (req, res) => {
    try {
      // Mock tracking is for local development only.
      if (
        process.env.NODE_ENV === "production" ||
        process.env.MOCK_TRACKING_ENABLED !== "true"
      ) {
        return res.status(403).json({
          message: "Mock tracking is disabled."
        });
      }

      const { data: shipment, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", req.params.id)
        .eq("user_id", req.auth.sub)
        .maybeSingle();

      if (error) throw error;

      if (!shipment) {
        return res.status(404).json({
          message: "Shipment not found."
        });
      }

      const statuses = [
        "Pending",
        "Processing",
        "In Transit",
        "Out for Delivery",
        "Delivered"
      ];

      const currentIndex = statuses.indexOf(shipment.status);

      if (currentIndex === -1) {
        return res.status(400).json({
          message: "This shipment status cannot be simulated."
        });
      }

      if (currentIndex === statuses.length - 1) {
        return res.json({
          message: "This shipment is already delivered.",
          shipment
        });
      }

      const nextStatus = statuses[currentIndex + 1];

      const { data: updatedShipment, error: updateError } =
        await supabase
          .from("shipments")
          .update({
            status: nextStatus,
            updated_at: new Date().toISOString()
          })
          .eq("id", shipment.id)
          .eq("user_id", req.auth.sub)
          .select()
          .single();

      if (updateError) throw updateError;

      return res.json({
        message: `Mock tracking updated to ${nextStatus}.`,
        shipment: updatedShipment
      });
    } catch (error) {
      console.error("Mock tracking error:", error.message);

      return res.status(500).json({
        message: "Unable to update mock tracking."
      });
    }
  }
);

/* =========================
   BILLING API
========================= */

// Get the user's subscription.
// If the user does not have one yet, create a Free subscription.
app.get("/api/billing/subscription", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub;

    let { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    // Create a Free plan for existing users who do not have a record.
    if (!subscription) {
      const result = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            plan: "free",
            status: "active",
          },
          { onConflict: "user_id" }
        )
        .select("*")
        .single();

      if (result.error) throw result.error;

      subscription = result.data;
    }

    return res.json({ subscription });
  } catch (error) {
    console.error("Get subscription error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve your subscription.",
    });
  }
});

// Get the logged-in user's payment history.
app.get("/api/billing/payments", requireAuth, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from("payments")
      .select(
        "id, amount, currency, status, provider, paid_at, created_at"
      )
      .eq("user_id", req.auth.sub)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({ payments });
  } catch (error) {
    console.error("Get payment history error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve payment history.",
    });
  }
});

// Show the available plans and their prices.
app.get("/api/billing/plans", (req, res) => {
  return res.json({
    plans: [
      {
        id: "free",
        name: "Free",
        price: 0,
        currency: "PHP",
        durationDays: null,
      },
      {
        id: "business",
        name: "Business",
        price: 299,
        currency: "PHP",
        durationDays: 30,
      },
    ],
  });
});


/* =========================
   PAYMONGO CHECKOUT
========================= */

app.post("/api/billing/checkout", requireAuth, async (req, res) => {
  const userId = req.auth.sub;
  const secretKey = process.env.PAYMONGO_SECRET_KEY;

  if (!secretKey || !secretKey.startsWith("sk_test_")) {
    return res.status(500).json({
      message: "A PayMongo test secret key is not configured.",
    });
  }

  let paymentId;

  try {
    // The price is set by the backend, not by the frontend.
    const amount = 29900; // ₱299.00 in centavos

    // Create a pending payment record first.
    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        amount,
        currency: "PHP",
        provider: "paymongo",
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    paymentId = payment.id;

    // Create the hosted checkout session.
    const paymongoResponse = await fetch(
      "https://api.paymongo.com/v2/checkout_sessions",
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${secretKey}:`).toString("base64"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              line_items: [
                {
                  name: "ShipStream Business Plan",
                  amount,
                  currency: "PHP",
                  quantity: 1,
                  description: "30-day ShipStream Business plan",
                },
              ],
                payment_method_types: ["card", "gcash", "qrph"],
                success_url: `${process.env.FRONTEND_URL}/billing?checkout=success`,
                cancel_url: `${process.env.FRONTEND_URL}/billing?checkout=cancelled`,
                reference_number: paymentId,
                metadata: {
                user_id: userId,
                payment_id: paymentId,
                plan: "business",
              },
            },
          },
        }),
      }
    );

    const result = await paymongoResponse.json();

    if (!paymongoResponse.ok) {
      console.error(
        "PayMongo checkout error:",
        JSON.stringify(result.errors || result)
      );

      await supabase
        .from("payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .eq("user_id", userId);

      return res.status(502).json({
        message:
          "PayMongo could not create the checkout session. Check your backend logs.",
      });
    }

    const session = result.data;
    const checkoutUrl = session?.attributes?.checkout_url;

    if (!session?.id || !checkoutUrl) {
      throw new Error("PayMongo returned an incomplete checkout session.");
    }

    // Link the local payment record to the PayMongo session.
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .eq("user_id", userId);

    if (updateError) throw updateError;

    return res.status(201).json({
      message: "Checkout session created.",
      checkoutUrl,
    });
  } catch (error) {
    console.error("Create checkout error:", error.message);

    if (paymentId) {
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .eq("user_id", userId);

      if (updateError) {
        console.error(
          "Payment cleanup error:",
          updateError.message
        );
      }
    }

    return res.status(500).json({
      message: "Unable to start checkout right now.",
    });
  }
});

// Verify PayMongo webhook signatures.
function verifyPayMongoSignature(req) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  const signatureHeader = req.headers["paymongo-signature"];

  if (!secret || !signatureHeader || !req.rawBody) {
    return false;
  }

  const parts = {};

  for (const part of signatureHeader.split(",")) {
    const separator = part.indexOf("=");

    if (separator === -1) continue;

    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();

    parts[key] = value;
  }

  if (!parts.t || (!parts.te && !parts.li)) {
    return false;
  }

  // Test mode uses "te"; live mode uses "li".
  const receivedSignature = parts.te || parts.li;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${parts.t}.${req.rawBody.toString("utf8")}`)
    .digest();

  let receivedBuffer;

  try {
    receivedBuffer = Buffer.from(receivedSignature, "hex");
  } catch {
    return false;
  }

  return (
    receivedBuffer.length === expectedSignature.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedSignature)
  );
}

// Receive PayMongo webhook events.
app.post("/api/webhooks/paymongo", async (req, res) => {
  if (!verifyPayMongoSignature(req)) {
    return res.status(401).json({
      message: "Invalid PayMongo webhook signature.",
    });
  }

  const envelope = req.body?.data?.attributes;
  console.log("PayMongo webhook event:", {
    eventType: envelope?.type,
    sessionId: envelope?.data?.id,
    referenceNumber: envelope?.data?.attributes?.reference_number,
    livemode: envelope?.livemode,
  });

  const eventType = envelope?.type;

  if (eventType !== "checkout_session.payment.paid") {
    return res.status(200).json({
      received: true,
      ignored: true,
    });
  }

  // PayMongo sends the checkout session inside attributes.data.
  const session = envelope?.data;

  if (!session || session.type !== "checkout_session") {
    return res.status(400).json({
      message: "Checkout session data is missing.",
    });
  }

  const attributes = session.attributes || {};
  const paymentId = attributes.reference_number;
  const metadata = attributes.metadata || {};

  // This backend currently creates test-mode checkout sessions only.
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  const isLive = attributes.livemode === true;

  if (
    !secretKey ||
    (isLive && !secretKey.startsWith("sk_live_")) ||
    (!isLive && !secretKey.startsWith("sk_test_"))
  ) {
    return res.status(400).json({
      message: "PayMongo mode does not match backend configuration.",
    });
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    typeof paymentId !== "string" ||
    !uuidPattern.test(paymentId) ||
    metadata.payment_id !== paymentId ||
    metadata.plan !== "business" ||
    typeof metadata.user_id !== "string" ||
    !uuidPattern.test(metadata.user_id)
  ) {
    return res.status(400).json({
      message: "Checkout reference or metadata is invalid.",
    });
  }

  const payments = Array.isArray(attributes.payments)
    ? attributes.payments
    : [];

  const paidPayment = payments.find(
    (payment) => payment?.attributes?.status === "paid"
  );

  if (!paidPayment) {
    return res.status(400).json({
      message: "No successful payment was found.",
    });
  }

  const lineItems = attributes.line_items;

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return res.status(400).json({
      message: "Checkout line items are missing.",
    });
  }

  let totalAmount = 0;

  for (const item of lineItems) {
    if (
      item?.currency !== "PHP" ||
      !Number.isSafeInteger(item?.amount) ||
      item.amount <= 0 ||
      !Number.isSafeInteger(item?.quantity) ||
      item.quantity <= 0
    ) {
      return res.status(400).json({
        message: "Invalid checkout line item.",
      });
    }

    totalAmount += item.amount * item.quantity;
  }

  if (
    totalAmount !== 29900 ||
    (paidPayment.attributes.amount !== undefined &&
      paidPayment.attributes.amount !== 29900) ||
    (paidPayment.attributes.currency !== undefined &&
      paidPayment.attributes.currency !== "PHP")
  ) {
    return res.status(400).json({
      message: "Paid amount does not match the Business plan.",
    });
  }
  try {
    // Confirm that this checkout matches our stored pending payment.
    const { data: payment, error: lookupError } = await supabase
      .from("payments")
      .select(
        "id, user_id, provider, amount, currency, status, checkout_session_id"
      )
      .eq("id", paymentId)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (!payment) {
      return res.status(400).json({
        message: "Matching ShipStream payment was not found.",
      });
    }

    if (
      payment.user_id !== metadata.user_id ||
      payment.provider !== "paymongo" ||
      payment.amount !== 29900 ||
      payment.currency?.toUpperCase() !== "PHP" ||
      payment.checkout_session_id !== session.id
    ) {
      return res.status(400).json({
        message: "Checkout does not match the stored payment.",
      });
    }

    const paidAt =
      Number.isFinite(attributes.paid_at) && attributes.paid_at > 0
        ? new Date(attributes.paid_at * 1000).toISOString()
        : new Date().toISOString();

    const { data, error: processError } = await supabase.rpc(
      "process_shipstream_paid_checkout",
      {
        p_payment_id: paymentId,
        p_checkout_session_id: session.id,
        p_amount: 29900,
        p_currency: "PHP",
        p_paid_at: paidAt,
      }
    );

if (processError) throw processError;

    if (processError) throw processError;

    console.log("PayMongo checkout processed:", {
      sessionId: session.id,
      paymentId,
      duplicate: data?.duplicate === true,
    });

    return res.status(200).json({
      received: true,
      processed: true,
      duplicate: data?.duplicate === true,
    });
  } catch (error) {
    console.error("PayMongo webhook processing error:", error.message);

    return res.status(500).json({
      message: "Unable to process payment. PayMongo can retry.",
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