const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const ActivityLogger = require("../services/ActivityLogger");

const prisma = new PrismaClient();

// POST /api/users/me/device-tokens - Cihaz token'ı ekle
router.post("/me/device-tokens", authenticateToken, async (req, res) => {
  try {
    const { token, platform } = req.body;
    const userId = req.user.id;

    if (!token || !platform) {
      return res.status(400).json({
        success: false,
        error: "Token ve platform alanları zorunludur.",
      });
    }

    // Upsert: Eğer token zaten varsa güncelle, yoksa yeni oluştur.
    // Bu, kullanıcının uygulamayı silip tekrar yüklemesi durumunda aynı token'ın tekrar kaydedilmesini sağlar.
    const deviceToken = await prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });

    res.status(201).json({
      success: true,
      message: "Cihaz token'ı başarıyla kaydedildi.",
      data: deviceToken,
    });
  } catch (error) {
    console.error("Save device token error:", error);
    res.status(500).json({
      success: false,
      error: "Cihaz token'ı kaydedilirken bir hata oluştu.",
    });
  }
});

// PATCH /api/users/lifestyle - Kullanıcının yaşam tarzını güncelle
router.patch("/lifestyle", authenticateToken, async (req, res) => {
  try {
    const { categories, preferences = {} } = req.body;
    const userId = req.user.id;

    // Validation
    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        error: "Categories array is required",
      });
    }

    // Valid categories check
    const validCategories = [
      "dini",
      "hayvanseverlik",
      "cevre",
      "saglik",
      "kariyer",
    ];
    const invalidCategories = categories.filter(
      (cat) => !validCategories.includes(cat)
    );

    if (invalidCategories.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid categories: ${invalidCategories.join(", ")}`,
      });
    }

    // Update user lifestyle
    const userLifestyle = await prisma.userLifestyle.upsert({
      where: { userId },
      update: {
        categories,
        preferences,
      },
      create: {
        userId,
        categories,
        preferences,
      },
    });

    // Update user with lifestyle relation
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
      include: {
        lifestyle: true,
        profile: true,
        stats: true,
        subscription: true,
      },
    });

    // Log activity
    await ActivityLogger.logActivity(userId, "lifestyle_updated", {
      categories,
      preferences_count: Object.keys(preferences).length,
    });

    res.json({
      success: true,
      message: "Lifestyle updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Lifestyle update error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update lifestyle",
    });
  }
});

// GET /api/users/profile - Kullanıcı profili
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        lifestyle: true,
        stats: true,
        subscription: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
    });
  }
});

module.exports = router;
