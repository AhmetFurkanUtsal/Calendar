const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

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

module.exports = router;
