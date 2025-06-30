const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const {
  authenticateToken,
  requireSubscription,
} = require("../middleware/auth");
const ActivityLogger = require("../services/ActivityLogger");
const { validate, noteSchemas } = require("../middleware/validation");

const prisma = new PrismaClient();

// GET /api/notes - Kullanıcının notlarını listele
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      category,
      search,
      tags,
      favorites,
      archived,
      page = 1,
      limit = 20,
    } = req.query;
    const userId = req.user.id;

    let where = { userId };

    if (category && category !== "all") where.category = category;
    if (favorites === "true") where.isFavorite = true;
    if (archived === "true") where.isArchived = true;
    if (archived === "false") where.isArchived = false;

    if (search) {
      where.OR = [{ title: { contains: search, mode: "insensitive" } }];
    }

    if (tags) {
      const tagArray = tags.split(",");
      where.tags = { hasSome: tagArray };
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        voiceNotes: true,
        attachments: true,
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.note.count({ where });

    // Log activity
    await ActivityLogger.logActivity(userId, "notes_viewed", {
      filter: { category, search, tags, favorites, archived },
      results_count: notes.length,
    });

    res.json({
      success: true,
      data: notes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get notes error:", error);
    res
      .status(500)
      .json({ success: false, error: "Notlar alınırken bir hata oluştu." });
  }
});

// POST /api/notes - Yeni not oluştur
router.post(
  "/",
  authenticateToken,
  validate(noteSchemas.create),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const noteData = { ...req.body, userId };

      const note = await prisma.note.create({
        data: noteData,
        include: {
          voiceNotes: true,
          attachments: true,
        },
      });

      // Update user stats
      await prisma.userStats.update({
        where: { userId },
        data: { totalNotesCreated: { increment: 1 } },
      });

      // Log activity
      await ActivityLogger.logNoteAction(userId, "created", note);

      res.status(201).json({
        success: true,
        message: "Not başarıyla oluşturuldu!",
        data: note,
      });
    } catch (error) {
      console.error("Create note error:", error);
      res
        .status(500)
        .json({ success: false, error: "Not oluşturulurken bir hata oluştu." });
    }
  }
);

// GET /api/notes/:id - Tek bir notu getir
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await prisma.note.findFirst({
      where: { id, userId },
      include: {
        voiceNotes: true,
        attachments: true,
      },
    });

    if (!note) {
      return res.status(404).json({ success: false, error: "Not bulunamadı." });
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Get note error:", error);
    res
      .status(500)
      .json({ success: false, error: "Not alınırken bir hata oluştu." });
  }
});

// PATCH /api/notes/:id - Not güncelle
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Check ownership
    const existingNote = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existingNote) {
      return res.status(404).json({ success: false, error: "Not bulunamadı." });
    }

    const note = await prisma.note.update({
      where: { id },
      data: updates,
      include: {
        voiceNotes: true,
        attachments: true,
      },
    });

    // Log activity
    await ActivityLogger.logNoteAction(userId, "updated", note);

    res.json({
      success: true,
      message: "Not başarıyla güncellendi!",
      data: note,
    });
  } catch (error) {
    console.error("Update note error:", error);
    res
      .status(500)
      .json({ success: false, error: "Not güncellenirken bir hata oluştu." });
  }
});

// DELETE /api/notes/:id - Not sil
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      return res.status(404).json({ success: false, error: "Not bulunamadı." });
    }

    await prisma.note.delete({
      where: { id },
    });

    // Log activity
    await ActivityLogger.logNoteAction(userId, "deleted", note);

    res.json({
      success: true,
      message: "Not başarıyla silindi!",
    });
  } catch (error) {
    console.error("Delete note error:", error);
    res
      .status(500)
      .json({ success: false, error: "Not silinirken bir hata oluştu." });
  }
});

// POST /api/notes/:id/voice - Ses notu ekle (Premium özellik)
router.post(
  "/:id/voice",
  authenticateToken,
  requireSubscription("PREMIUM"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { audioUrl, duration, transcription } = req.body;

      // Check note ownership
      const note = await prisma.note.findFirst({
        where: { id, userId },
      });

      if (!note) {
        return res
          .status(404)
          .json({ success: false, error: "Not bulunamadı." });
      }

      const voiceNote = await prisma.voiceNote.create({
        data: {
          noteId: id,
          audioUrl,
          duration,
          transcription,
        },
      });

      // Update daily voice note counter
      await prisma.userStats.update({
        where: { userId },
        data: { dailyVoiceNotes: { increment: 1 } },
      });

      // Log activity
      await ActivityLogger.logVoiceNote(userId, duration, !!transcription);

      res.status(201).json({
        success: true,
        message: "Ses notu başarıyla eklendi!",
        data: voiceNote,
      });
    } catch (error) {
      console.error("Create voice note error:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Ses notu eklenirken bir hata oluştu.",
        });
    }
  }
);

// POST /api/notes/:id/favorite - Notu favorilere ekle/çıkar
router.post("/:id/favorite", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      return res.status(404).json({ success: false, error: "Not bulunamadı." });
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { isFavorite: !note.isFavorite },
    });

    res.json({
      success: true,
      message: updatedNote.isFavorite
        ? "Not favorilere eklendi!"
        : "Not favorilerden çıkarıldı!",
      data: { isFavorite: updatedNote.isFavorite },
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Favori durumu değiştirilirken bir hata oluştu.",
      });
  }
});

// POST /api/notes/:id/archive - Notu arşivle/arşivden çıkar
router.post("/:id/archive", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      return res.status(404).json({ success: false, error: "Not bulunamadı." });
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { isArchived: !note.isArchived },
    });

    res.json({
      success: true,
      message: updatedNote.isArchived
        ? "Not arşivlendi!"
        : "Not arşivden çıkarıldı!",
      data: { isArchived: updatedNote.isArchived },
    });
  } catch (error) {
    console.error("Toggle archive error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Arşiv durumu değiştirilirken bir hata oluştu.",
      });
  }
});

// POST /api/notes/:id/duplicate - Notu kopyala
router.post("/:id/duplicate", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const originalNote = await prisma.note.findFirst({
      where: { id, userId },
      include: {
        voiceNotes: true,
        attachments: true,
      },
    });

    if (!originalNote) {
      return res.status(404).json({ success: false, error: "Not bulunamadı." });
    }

    const duplicatedNote = await prisma.note.create({
      data: {
        userId,
        title: `${originalNote.title} (Kopya)`,
        blocks: originalNote.blocks,
        tags: originalNote.tags,
        category: originalNote.category,
      },
    });

    res.status(201).json({
      success: true,
      message: "Not başarıyla kopyalandı!",
      data: duplicatedNote,
    });
  } catch (error) {
    console.error("Duplicate note error:", error);
    res
      .status(500)
      .json({ success: false, error: "Not kopyalanırken bir hata oluştu." });
  }
});

// GET /api/notes/search/content - İçerik tabanlı arama
router.get("/search/content", authenticateToken, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const userId = req.user.id;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Arama terimi en az 2 karakter olmalıdır.",
      });
    }

    // Search in title and block content
    const notes = await prisma.note.findMany({
      where: {
        userId,
        isArchived: false,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          // Note: JSON search might need raw queries in some databases
        ],
      },
      take: parseInt(limit),
      orderBy: { updatedAt: "desc" },
    });

    res.json({
      success: true,
      data: notes,
      searchTerm: q,
    });
  } catch (error) {
    console.error("Search notes error:", error);
    res
      .status(500)
      .json({ success: false, error: "Arama sırasında bir hata oluştu." });
  }
});

// GET /api/notes/tags - Kullanıcının tüm etiketlerini getir
router.get("/tags", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all unique tags from user's notes
    const notes = await prisma.note.findMany({
      where: { userId, isArchived: false },
      select: { tags: true },
    });

    const allTags = notes.flatMap((note) => note.tags);
    const uniqueTags = [...new Set(allTags)];

    res.json({
      success: true,
      data: uniqueTags.sort(),
    });
  } catch (error) {
    console.error("Get tags error:", error);
    res
      .status(500)
      .json({ success: false, error: "Etiketler alınırken bir hata oluştu." });
  }
});

module.exports = router;
