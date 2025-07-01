const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, aiRateLimit } = require("../middleware/auth");
const ActivityLogger = require("../services/ActivityLogger");
const { validate, aiSchemas } = require("../middleware/validation");

const prisma = new PrismaClient();

// AI Service Integration (Google Gemini Pro veya OpenAI)
class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    this.provider = process.env.AI_PROVIDER || "gemini"; // 'gemini' or 'openai'
  }

  async generateResponse(prompt, context = {}) {
    try {
      if (this.provider === "gemini") {
        return await this.callGeminiAPI(prompt, context);
      } else {
        return await this.callOpenAIAPI(prompt, context);
      }
    } catch (error) {
      console.error("AI Service error:", error);
      throw new Error("AI servisi şu anda kullanılamıyor.");
    }
  }

  async callGeminiAPI(prompt, context) {
    // Google Gemini Pro API implementation
    const systemPrompt = this.buildSystemPrompt(context);
    const fullPrompt = `${systemPrompt}\n\nKullanıcı: ${prompt}`;

    // Simulate API call - replace with actual Gemini API
    return {
      response:
        "Bu bir örnek AI yanıtıdır. Gerçek Gemini Pro API entegrasyonu yapılacak.",
      tokens: 150,
      model: "gemini-pro",
    };
  }

  async callOpenAIAPI(prompt, context) {
    // OpenAI API implementation
    const systemPrompt = this.buildSystemPrompt(context);

    // Simulate API call - replace with actual OpenAI API
    return {
      response:
        "Bu bir örnek AI yanıtıdır. Gerçek OpenAI API entegrasyonu yapılacak.",
      tokens: 150,
      model: "gpt-4",
    };
  }

  buildSystemPrompt(context) {
    const {
      userLifestyle,
      currentDate,
      location,
      pendingTasks,
      upcomingEvents,
    } = context;

    let systemPrompt = `Sen LifeSync uygulamasının AI asistanısın. Kullanıcılara yaşam tarzlarına göre kişiselleştirilmiş yardım sağlıyorsun.

KULLANICI BİLGİLERİ:
- Yaşam tarzı kategorileri: ${userLifestyle?.join(", ") || "Belirtilmemiş"}
- Tarih: ${currentDate || new Date().toLocaleDateString("tr-TR")}
- Konum: ${location || "Belirtilmemiş"}

ÖZEL YETENEKLERİN:
1. Görev yönetimi ve öncelik belirleme
2. Takvim planlama ve zaman yönetimi
3. Yaşam tarzı kategorilerine göre öneriler
4. Namaz vakitleri (dini kategori için)
5. Motivasyonel destek

`;

    if (pendingTasks?.length > 0) {
      systemPrompt += `BEKLEYEN GÖREVLER: ${pendingTasks.length} adet\n`;
    }

    if (upcomingEvents?.length > 0) {
      systemPrompt += `YAKLAŞAN ETKİNLİKLER: ${upcomingEvents.length} adet\n`;
    }

    systemPrompt += `\nYanıtlarını Türkçe ver ve kullanıcının yaşam tarzına uygun öneriler sun.`;

    return systemPrompt;
  }
}

const aiService = new AIService();

// POST /api/ai/chat - AI ile sohbet
router.post(
  "/chat",
  authenticateToken,
  aiRateLimit,
  validate(aiSchemas.chat),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { message, context = {} } = req.body;

      // Enrich context with user data
      const enrichedContext = {
        ...context,
        userLifestyle: req.user.lifestyle?.categories || [],
        currentDate: new Date().toISOString(),
        location: req.user.profile?.city || "Istanbul",
      };

      // Get pending tasks and upcoming events for context
      if (!context.pendingTasks) {
        const pendingTasks = await prisma.task.findMany({
          where: { userId, isCompleted: false },
          take: 5,
          select: { title: true, priority: true, category: true },
        });
        enrichedContext.pendingTasks = pendingTasks;
      }

      if (!context.upcomingEvents) {
        const upcomingEvents = await prisma.event.findMany({
          where: {
            userId,
            startTime: { gte: new Date() },
          },
          take: 5,
          select: { title: true, startTime: true, category: true },
        });
        enrichedContext.upcomingEvents = upcomingEvents;
      }

      // Generate AI response
      const aiResponse = await aiService.generateResponse(
        message,
        enrichedContext
      );

      // Update user stats
      await prisma.userStats.update({
        where: { userId },
        data: {
          totalAIInteractions: { increment: 1 },
          dailyAIRequests: { increment: 1 },
        },
      });

      // Log activity
      await ActivityLogger.logAIInteraction(
        userId,
        message,
        aiResponse.response,
        "text"
      );

      res.json({
        success: true,
        data: {
          message: aiResponse.response,
          model: aiResponse.model,
          tokens: aiResponse.tokens,
          context: {
            hasTaskContext: enrichedContext.pendingTasks?.length > 0,
            hasEventContext: enrichedContext.upcomingEvents?.length > 0,
            lifestyle: enrichedContext.userLifestyle,
          },
        },
      });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "AI sohbet sırasında bir hata oluştu.",
      });
    }
  }
);

// POST /api/ai/suggestions/tasks - Görev önerileri
router.post(
  "/suggestions/tasks",
  authenticateToken,
  aiRateLimit,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userLifestyle = req.user.lifestyle?.categories || [];

      // Get user's recent tasks for context
      const recentTasks = await prisma.task.findMany({
        where: { userId },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { title: true, category: true, priority: true },
      });

      const prompt = `Kullanıcının yaşam tarzı kategorilerine (${userLifestyle.join(
        ", "
      )}) uygun yeni görev önerileri ver. Son görevleri: ${recentTasks
        .map((t) => t.title)
        .join(", ")}`;

      const aiResponse = await aiService.generateResponse(prompt, {
        userLifestyle,
        recentTasks,
      });

      // Log activity
      await ActivityLogger.logAIInteraction(
        userId,
        prompt,
        aiResponse.response,
        "task_suggestions"
      );

      res.json({
        success: true,
        data: {
          suggestions: aiResponse.response,
          basedOn: {
            lifestyle: userLifestyle,
            recentTasksCount: recentTasks.length,
          },
        },
      });
    } catch (error) {
      console.error("AI task suggestions error:", error);
      res.status(500).json({
        success: false,
        error: "Görev önerileri alınırken bir hata oluştu.",
      });
    }
  }
);

// POST /api/ai/analyze/schedule - Takvim analizi ve optimizasyon
router.post(
  "/analyze/schedule",
  authenticateToken,
  aiRateLimit,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { date } = req.body;

      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get day's events and tasks
      const [events, tasks] = await Promise.all([
        prisma.event.findMany({
          where: {
            userId,
            startTime: { gte: startOfDay, lte: endOfDay },
          },
          orderBy: { startTime: "asc" },
        }),
        prisma.task.findMany({
          where: {
            userId,
            OR: [
              { dueDate: { gte: startOfDay, lte: endOfDay } },
              { isCompleted: false, dueDate: null },
            ],
          },
          orderBy: { priority: "desc" },
        }),
      ]);

      const prompt = `Bu günün programını analiz et ve optimize et:
    
ETKİNLİKLER: ${events
        .map((e) => `${e.title} (${e.startTime.toLocaleTimeString("tr-TR")})`)
        .join(", ")}

GÖREVLER: ${tasks.map((t) => `${t.title} (${t.priority} öncelik)`).join(", ")}

Zaman çakışmaları, boş alanlar ve verimlilik önerileri sun.`;

      const aiResponse = await aiService.generateResponse(prompt, {
        events,
        tasks,
        date: targetDate.toLocaleDateString("tr-TR"),
      });

      res.json({
        success: true,
        data: {
          analysis: aiResponse.response,
          scheduleData: {
            eventsCount: events.length,
            tasksCount: tasks.length,
            date: targetDate.toLocaleDateString("tr-TR"),
          },
        },
      });
    } catch (error) {
      console.error("AI schedule analysis error:", error);
      res.status(500).json({
        success: false,
        error: "Takvim analizi sırasında bir hata oluştu.",
      });
    }
  }
);

// POST /api/ai/prayer-reminder - Namaz hatırlatıcısı (dini kategori için)
router.post("/prayer-reminder", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userLifestyle = req.user.lifestyle?.categories || [];

    // Check if user has religious lifestyle
    if (!userLifestyle.includes("dini")) {
      return res.status(403).json({
        success: false,
        error:
          "Bu özellik sadece dini yaşam tarzını seçen kullanıcılar için mevcut.",
      });
    }

    const location = req.user.profile?.city || "Istanbul";
    const prompt = `${location} için bugünkü namaz vakitlerini söyle ve hatırlatıcı mesajı ver.`;

    const aiResponse = await aiService.generateResponse(prompt, {
      userLifestyle,
      location,
      feature: "prayer_reminder",
    });

    // Log prayer-related activity
    await ActivityLogger.logActivity(userId, "prayer_reminder_requested", {
      location,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      data: {
        reminder: aiResponse.response,
        location,
      },
    });
  } catch (error) {
    console.error("AI prayer reminder error:", error);
    res.status(500).json({
      success: false,
      error: "Namaz hatırlatıcısı alınırken bir hata oluştu.",
    });
  }
});

// GET /api/ai/conversation-history - Sohbet geçmişi
router.get("/conversation-history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const activities = await prisma.userActivity.findMany({
      where: {
        userId,
        action: "ai_interaction",
      },
      orderBy: { timestamp: "desc" },
      take: parseInt(limit),
    });

    const conversations = activities.map((activity) => ({
      id: activity.id,
      prompt: activity.details?.prompt || "",
      timestamp: activity.timestamp,
      type: activity.details?.interaction_type || "text",
    }));

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Get conversation history error:", error);
    res.status(500).json({
      success: false,
      error: "Sohbet geçmişi alınırken bir hata oluştu.",
    });
  }
});

// GET /api/ai/usage-stats - AI kullanım istatistikleri
router.get("/usage-stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userStats = req.user.stats;
    const userPlan = req.user.subscription?.plan || "FREE";

    const limits = {
      FREE: 10,
      PREMIUM: 100,
      PRO: -1, // Unlimited
    };

    const dailyLimit = limits[userPlan];
    const used = userStats?.dailyAIRequests || 0;
    const remaining =
      dailyLimit === -1 ? "Sınırsız" : Math.max(0, dailyLimit - used);

    res.json({
      success: true,
      data: {
        plan: userPlan,
        dailyLimit,
        used,
        remaining,
        totalInteractions: userStats?.totalAIInteractions || 0,
        resetTime: "00:00", // Daily reset at midnight
      },
    });
  } catch (error) {
    console.error("Get AI usage stats error:", error);
    res.status(500).json({
      success: false,
      error: "AI kullanım istatistikleri alınırken bir hata oluştu.",
    });
  }
});

module.exports = router;
