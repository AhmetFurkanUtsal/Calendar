const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const ActivityLogger = require("../services/ActivityLogger");

const prisma = new PrismaClient();

// GET /api/analytics/activity - Kullanıcı aktivite özeti (ÖZEL İSTEK)
router.get("/activity", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const activitySummary = await ActivityLogger.getUserActivitySummary(
      userId,
      parseInt(days)
    );

    res.json({
      success: true,
      data: activitySummary,
      timeRange: `${days} gün`,
    });
  } catch (error) {
    console.error("Get activity analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Aktivite analizi alınırken bir hata oluştu.",
    });
  }
});

// GET /api/analytics/activity/heatmap - Aktivite ısı haritası
router.get("/activity/heatmap", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 365 } = req.query;

    const heatmapData = await ActivityLogger.getActivityHeatmap(
      userId,
      parseInt(days)
    );

    res.json({
      success: true,
      data: heatmapData,
      timeRange: `${days} gün`,
    });
  } catch (error) {
    console.error("Get activity heatmap error:", error);
    res.status(500).json({
      success: false,
      error: "Aktivite ısı haritası alınırken bir hata oluştu.",
    });
  }
});

// GET /api/analytics/features - En çok kullanılan özellikler
router.get("/features", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const mostUsedFeatures = await ActivityLogger.getMostUsedFeatures(
      userId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: mostUsedFeatures,
    });
  } catch (error) {
    console.error("Get feature analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Özellik analizi alınırken bir hata oluştu.",
    });
  }
});

// GET /api/analytics/productivity - Verimlilik metrikleri
router.get("/productivity", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "week" } = req.query; // week, month, year

    let startDate;
    const endDate = new Date();

    switch (period) {
      case "week":
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "year":
        startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
    }

    // Get productivity metrics
    const [tasksStats, eventsStats, notesStats, aiStats] = await Promise.all([
      prisma.task.groupBy({
        by: ["isCompleted"],
        where: {
          userId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      }),
      prisma.event.count({
        where: {
          userId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.note.count({
        where: {
          userId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.userActivity.count({
        where: {
          userId,
          action: "ai_interaction",
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    // Calculate task completion rate
    const totalTasks = tasksStats.reduce(
      (sum, stat) => sum + stat._count.id,
      0
    );
    const completedTasks =
      tasksStats.find((stat) => stat.isCompleted)?._count.id || 0;
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get daily breakdown
    const dailyActivities = await prisma.userActivity.groupBy({
      by: ["timestamp"],
      where: {
        userId,
        timestamp: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    });

    // Process daily data
    const dailyBreakdown = {};
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      dailyBreakdown[dateKey] = 0;
    }

    dailyActivities.forEach((activity) => {
      const dateKey = activity.timestamp.toISOString().split("T")[0];
      if (dailyBreakdown[dateKey] !== undefined) {
        dailyBreakdown[dateKey] = activity._count.id;
      }
    });

    // Calculate average daily activity
    const totalActivity = Object.values(dailyBreakdown).reduce(
      (sum, count) => sum + count,
      0
    );
    const averageDailyActivity = totalActivity / days;

    res.json({
      success: true,
      data: {
        period,
        summary: {
          tasksCreated: totalTasks,
          tasksCompleted: completedTasks,
          completionRate: Math.round(completionRate),
          eventsCreated: eventsStats,
          notesCreated: notesStats,
          aiInteractions: aiStats,
        },
        trends: {
          dailyBreakdown,
          averageDailyActivity: Math.round(averageDailyActivity),
          mostActiveDay:
            Object.entries(dailyBreakdown).sort(
              ([, a], [, b]) => b - a
            )[0]?.[0] || null,
        },
      },
    });
  } catch (error) {
    console.error("Get productivity analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Verimlilik analizi alınırken bir hata oluştu.",
    });
  }
});

// GET /api/analytics/categories - Kategori analizi
router.get("/categories", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "month" } = req.query;

    let startDate;
    const endDate = new Date();

    switch (period) {
      case "week":
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "year":
        startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
    }

    // Get category distribution
    const [tasksByCategory, eventsByCategory, notesByCategory] =
      await Promise.all([
        prisma.task.groupBy({
          by: ["category"],
          where: {
            userId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: { id: true },
        }),
        prisma.event.groupBy({
          by: ["category"],
          where: {
            userId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: { id: true },
        }),
        prisma.note.groupBy({
          by: ["category"],
          where: {
            userId,
            category: { not: null },
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: { id: true },
        }),
      ]);

    // Combine category data
    const categoryData = {};
    const categories = [
      "DINI",
      "HAYVANSEVERLIK",
      "CEVRE",
      "KARIYER",
      "SAGLIK",
      "KISISEL",
    ];

    categories.forEach((category) => {
      categoryData[category] = {
        tasks:
          tasksByCategory.find((c) => c.category === category)?._count.id || 0,
        events:
          eventsByCategory.find((c) => c.category === category)?._count.id || 0,
        notes:
          notesByCategory.find((c) => c.category === category)?._count.id || 0,
      };
      categoryData[category].total =
        categoryData[category].tasks +
        categoryData[category].events +
        categoryData[category].notes;
    });

    // Find most active category
    const mostActiveCategory =
      Object.entries(categoryData).sort(
        ([, a], [, b]) => b.total - a.total
      )[0]?.[0] || null;

    res.json({
      success: true,
      data: {
        period,
        categories: categoryData,
        mostActiveCategory,
        insights: {
          totalItems: Object.values(categoryData).reduce(
            (sum, cat) => sum + cat.total,
            0
          ),
          distributionBalance: this.calculateDistributionBalance(categoryData),
        },
      },
    });
  } catch (error) {
    console.error("Get category analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Kategori analizi alınırken bir hata oluştu.",
    });
  }
});

// Helper function for distribution balance
function calculateDistributionBalance(categoryData) {
  const values = Object.values(categoryData).map((cat) => cat.total);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
    values.length;
  const standardDeviation = Math.sqrt(variance);

  // Lower standard deviation = more balanced
  if (standardDeviation < average * 0.3) return "Dengeli";
  if (standardDeviation < average * 0.6) return "Orta";
  return "Dengesiz";
}

// GET /api/analytics/goals - Hedef takibi
router.get("/goals", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userStats = req.user.stats;

    // Define goal targets (can be made configurable)
    const goals = {
      dailyTasks: {
        target: 5,
        current: await this.getTodayTasksCount(userId),
        type: "daily",
      },
      weeklyEvents: {
        target: 10,
        current: await this.getWeekEventsCount(userId),
        type: "weekly",
      },
      monthlyNotes: {
        target: 20,
        current: await this.getMonthNotesCount(userId),
        type: "monthly",
      },
      currentStreak: {
        target: 30,
        current: userStats?.currentStreak || 0,
        type: "streak",
      },
    };

    // Calculate progress percentages
    Object.keys(goals).forEach((goal) => {
      const { target, current } = goals[goal];
      goals[goal].progress = Math.min((current / target) * 100, 100);
      goals[goal].achieved = current >= target;
    });

    res.json({
      success: true,
      data: {
        goals,
        overallProgress:
          Object.values(goals).reduce((sum, goal) => sum + goal.progress, 0) /
          Object.keys(goals).length,
        achievedGoals: Object.values(goals).filter((goal) => goal.achieved)
          .length,
        totalGoals: Object.keys(goals).length,
      },
    });
  } catch (error) {
    console.error("Get goals analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Hedef analizi alınırken bir hata oluştu.",
    });
  }
});

// Helper functions for goals
async function getTodayTasksCount(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return await prisma.task.count({
    where: {
      userId,
      isCompleted: true,
      completedAt: { gte: today, lt: tomorrow },
    },
  });
}

async function getWeekEventsCount(userId) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  return await prisma.event.count({
    where: {
      userId,
      createdAt: { gte: weekStart },
    },
  });
}

async function getMonthNotesCount(userId) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return await prisma.note.count({
    where: {
      userId,
      createdAt: { gte: monthStart },
    },
  });
}

// POST /api/analytics/log-screen - Screen view loglama
router.post("/log-screen", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { screenName, params = {} } = req.body;

    await ActivityLogger.logScreenView(userId, screenName, params);

    res.json({
      success: true,
      message: "Screen view logged successfully",
    });
  } catch (error) {
    console.error("Log screen view error:", error);
    res.status(500).json({
      success: false,
      error: "Screen view loglanamadı.",
    });
  }
});

// GET /api/analytics/insights - Kişiselleştirilmiş içgörüler
router.get("/insights", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userStats = req.user.stats;
    const userLifestyle = req.user.lifestyle?.categories || [];

    // Generate personalized insights
    const insights = [];

    // Task completion insight
    if (userStats?.totalTasksCompleted > 0) {
      const completionRate =
        (userStats.totalTasksCompleted / (userStats.totalTasksCompleted + 10)) *
        100; // Estimate
      if (completionRate > 80) {
        insights.push({
          type: "success",
          title: "Mükemmel Görev Tamamlama!",
          message: `%${Math.round(
            completionRate
          )} görev tamamlama oranınız ile harika gidiyorsunuz!`,
          icon: "🎯",
        });
      }
    }

    // Streak insight
    if (userStats?.currentStreak > 7) {
      insights.push({
        type: "achievement",
        title: "Süreklilik Şampiyonu!",
        message: `${userStats.currentStreak} günlük aktif kullanım seriniz devam ediyor!`,
        icon: "🔥",
      });
    }

    // Lifestyle-specific insights
    if (
      userLifestyle.includes("dini") &&
      userStats?.totalPrayersPerformed > 0
    ) {
      insights.push({
        type: "spiritual",
        title: "Manevi Gelişim",
        message: `Şimdiye kadar ${userStats.totalPrayersPerformed} namaz kaydınız var. Maşallah!`,
        icon: "🕌",
      });
    }

    // AI usage insight
    if (userStats?.totalAIInteractions > 50) {
      insights.push({
        type: "productivity",
        title: "AI Uzmanı",
        message: `${userStats.totalAIInteractions} AI etkileşimi ile teknolojiyi etkin kullanıyorsunuz!`,
        icon: "🤖",
      });
    }

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error("Get insights error:", error);
    res.status(500).json({
      success: false,
      error: "İçgörüler alınırken bir hata oluştu.",
    });
  }
});

module.exports = router;
