const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

function createToken(userId) {
  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
}

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Hash OTP using a server-side secret
function hashValue(value) {
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(value)
    .digest("hex");
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length > 80) {
      return res.status(400).json({
        message: "Name must be between 1 and 80 characters.",
      });
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      cleanEmail.length > 254
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      token: createToken(user._id),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Unable to create account right now.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

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

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    const passwordMatches = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    return res.json({
      message: "Login successful.",
      token: createToken(user._id),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in right now.",
    });
  }
});

// FORGOT PASSWORD - SEND OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "Please enter your email address.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: cleanEmail,
    }).select(
      "+resetOtpHash +resetOtpExpires +resetOtpAttempts +resetOtpLastSent"
    );

    // Do not reveal whether an account exists.
    const genericMessage =
      "If an account exists, a verification code will be sent.";

    if (!user) {
      return res.json({ message: genericMessage });
    }

    // Allow one OTP every 60 seconds.
    if (
      user.resetOtpLastSent &&
      Date.now() - user.resetOtpLastSent.getTime() < 60000
    ) {
      return res.status(429).json({
        message: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    user.resetOtpHash = hashValue(otp);
    user.resetOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.resetOtpAttempts = 0;
    user.resetOtpLastSent = new Date();

    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    try {
      await transporter.sendMail({
        from: `"Tasbih Counter" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Your Tasbih Counter Password Reset OTP",
        text: `Your password reset OTP is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
        html: `
          <div style="font-family:Arial,sans-serif;padding:25px;color:#12352a">
            <h2>Tasbih Counter</h2>
            <p>You requested to reset your password.</p>
            <h1 style="letter-spacing:8px;color:#b58b3b">${otp}</h1>
            <p>This code expires in 5 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("OTP email error:", emailError.message);

      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      user.resetOtpAttempts = 0;
      await user.save();

      return res.status(500).json({
        message: "Unable to send OTP. Please try again later.",
      });
    }

    return res.json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      message: "Unable to process your request.",
    });
  }
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (
      typeof email !== "string" ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        message: "Enter a valid 6-digit OTP.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select(
      "+resetOtpHash +resetOtpExpires +resetOtpAttempts"
    );

    if (
      !user ||
      !user.resetOtpHash ||
      !user.resetOtpExpires ||
      user.resetOtpExpires < new Date()
    ) {
      return res.status(400).json({
        message: "Invalid or expired OTP.",
      });
    }

    if (user.resetOtpAttempts >= 5) {
      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      await user.save();

      return res.status(429).json({
        message: "Too many incorrect attempts. Request a new OTP.",
      });
    }

    if (
      hashValue(otp) !== user.resetOtpHash
    ) {
      user.resetOtpAttempts += 1;
      await user.save();

      return res.status(400).json({
        message: "Incorrect OTP.",
      });
    }

    // Generate a short-lived password reset token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetTokenHash = hashValue(resetToken);
    user.resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

    // OTP can no longer be reused.
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;

    await user.save();

    return res.json({
      message: "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error("OTP verification error:", error.message);

    return res.status(500).json({
      message: "Unable to verify OTP.",
    });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (
      typeof email !== "string" ||
      typeof resetToken !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        message: "Missing required information.",
      });
    }

    if (
      newPassword.length < 8 ||
      Buffer.byteLength(newPassword, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+resetTokenHash +resetTokenExpires +password");

    if (
      !user ||
      !user.resetTokenHash ||
      !user.resetTokenExpires ||
      user.resetTokenExpires < new Date() ||
      hashValue(resetToken) !== user.resetTokenHash
    ) {
      return res.status(400).json({
        message: "Password reset session is invalid or expired.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    // Clear all reset credentials after success.
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    return res.json({
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    console.error("Password reset error:", error.message);

    return res.status(500).json({
      message: "Unable to reset password.",
    });
  }
});

// CURRENT LOGGED-IN USER
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({
        message: "Account not found. Please log in again.",
      });
    }

    return res.json({
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      message: "Unable to load your account.",
    });
  }
});

module.exports = router;