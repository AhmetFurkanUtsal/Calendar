const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { validate, userSchemas } = require("../middleware/validation");
const { authenticateToken } = require("../middleware/auth");
const ActivityLogger = require("../services/ActivityLogger");

const prisma = new PrismaClient();

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.SESSION_EXPIRE_TIME || "24h",
  });
};

// POST /api/auth/register - Yeni kullanıcı kaydı
router.post("/register", validate(userSchemas.register), async (req, res) => {
  try {
    const {
      email,
      password,
      displayName,
      categories = [],
      city,
      timezone,
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Bu email adresi zaten kayıtlı.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with related data
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName: displayName || email.split("@")[0],
        profile: {
          create: {
            city,
            timezone: timezone || "Europe/Istanbul",
            language: "tr",
          },
        },
        lifestyle: {
          create: {
            categories,
            preferences: {},
          },
        },
        settings: {
          create: {
            notifications: {
              email: true,
              push: true,
              prayerReminders: categories.includes("dini"),
            },
            privacy: {
              showProfile: true,
              showStats: true,
            },
            appearance: {
              theme: "light",
            },
          },
        },
        stats: {
          create: {},
        },
        subscription: {
          create: {
            plan: "FREE",
            status: "ACTIVE",
            startDate: new Date(),
          },
        },
      },
      include: {
        profile: true,
        lifestyle: true,
        subscription: true,
      },
    });

    // Generate token
    const token = generateToken(user.id);

    // Log registration
    await ActivityLogger.logAuth(user.id, "register", {
      platform: req.headers["user-agent"],
      ip: req.ip,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: "Kayıt başarılı!",
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: "Kayıt sırasında bir hata oluştu.",
    });
  }
});

// POST /api/auth/login - Kullanıcı girişi
router.post("/login", validate(userSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with relations
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        lifestyle: true,
        subscription: true,
        stats: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Email veya şifre hatalı.",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Email veya şifre hatalı.",
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = generateToken(user.id);

    // Log login
    await ActivityLogger.logAuth(user.id, "login", {
      platform: req.headers["user-agent"],
      ip: req.ip,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Giriş başarılı!",
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Giriş sırasında bir hata oluştu.",
    });
  }
});

// POST /api/auth/logout - Kullanıcı çıkışı
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Log logout
    await ActivityLogger.logAuth(req.user.id, "logout", {
      platform: req.headers["user-agent"],
      ip: req.ip,
    });

    res.json({
      success: true,
      message: "Çıkış başarılı!",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Çıkış sırasında bir hata oluştu.",
    });
  }
});

// GET /api/auth/me - Mevcut kullanıcı bilgileri
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        lifestyle: true,
        subscription: true,
        stats: true,
        settings: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Kullanıcı bulunamadı.",
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Kullanıcı bilgileri alınırken bir hata oluştu.",
    });
  }
});

// POST /api/auth/refresh - Token yenileme
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    const newToken = generateToken(req.user.id);

    res.json({
      success: true,
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      error: "Token yenileme sırasında bir hata oluştu.",
    });
  }
});

// POST /api/auth/verify-email - Email doğrulama
router.post("/verify-email", authenticateToken, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isVerified: true },
    });

    res.json({
      success: true,
      message: "Email adresiniz doğrulandı!",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      error: "Email doğrulama sırasında bir hata oluştu.",
    });
  }
});

// POST /api/auth/update-lifestyle - Yaşam tarzı güncelleme
router.post("/update-lifestyle", authenticateToken, async (req, res) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        error: "En az bir yaşam tarzı kategorisi seçmelisiniz.",
      });
    }

    // Update user lifestyle
    await prisma.userLifestyle.update({
      where: { userId: req.user.id },
      data: {
        categories,
        preferences: {},
      },
    });

    // Update settings based on lifestyle
    await prisma.userSettings.update({
      where: { userId: req.user.id },
      data: {
        notifications: {
          email: true,
          push: true,
          prayerReminders: categories.includes("dini"),
        },
      },
    });

    res.json({
      success: true,
      message: "Yaşam tarzı bilgileriniz güncellendi!",
    });
  } catch (error) {
    console.error("Update lifestyle error:", error);
    res.status(500).json({
      success: false,
      error: "Yaşam tarzı güncellenirken bir hata oluştu.",
    });
  }
});

module.exports = router;
