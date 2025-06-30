const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const ActivityLogger = require("../services/ActivityLogger");

const prisma = new PrismaClient();

// GET /api/community/stats - Topluluk istatistikleri (ÖZEL İSTEK)
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category = "all", period = "week" } = req.query;

    // Calculate date range
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

    // Get community statistics
    const [totalUsers, totalTasks, totalEvents, totalNotes, categoryStats] =
      await Promise.all([
        prisma.user.count(),
        prisma.task.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            ...(category !== "all" && { category: category.toUpperCase() }),
          },
        }),
        prisma.event.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            ...(category !== "all" && { category: category.toUpperCase() }),
          },
        }),
        prisma.note.count({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            ...(category !== "all" && { category: category.toUpperCase() }),
          },
        }),
        this.getCategoryStatistics(startDate, endDate),
      ]);

    // Get motivational messages based on category
    const motivationalMessages = this.getMotivationalMessages(category);

    // Calculate user's rank
    const userRank = await this.calculateUserRank(userId, period);

    // Log activity
    await ActivityLogger.logCommunityStatsView(userId, category);

    res.json({
      success: true,
      data: {
        period,
        category,
        community: {
          totalUsers,
          totalTasks,
          totalEvents,
          totalNotes,
          totalActivities: totalTasks + totalEvents + totalNotes,
        },
        categoryBreakdown: categoryStats,
        motivationalMessages,
        userRank,
        insights: this.generateCommunityInsights(
          totalTasks,
          totalEvents,
          totalNotes,
          category
        ),
      },
    });
  } catch (error) {
    console.error("Get community stats error:", error);
    res.status(500).json({
      success: false,
      error: "Topluluk istatistikleri alınırken bir hata oluştu.",
    });
  }
});

// Helper function to get category statistics
async function getCategoryStatistics(startDate, endDate) {
  const categories = [
    "DINI",
    "HAYVANSEVERLIK",
    "CEVRE",
    "KARIYER",
    "SAGLIK",
    "KISISEL",
  ];
  const categoryStats = {};

  for (const category of categories) {
    const [tasks, events, notes] = await Promise.all([
      prisma.task.count({
        where: { category, createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.event.count({
        where: { category, createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.note.count({
        where: { category, createdAt: { gte: startDate, lte: endDate } },
      }),
    ]);

    categoryStats[category.toLowerCase()] = {
      tasks,
      events,
      notes,
      total: tasks + events + notes,
    };
  }

  return categoryStats;
}

// Helper function to get motivational messages
function getMotivationalMessages(category) {
  const messages = {
    dini: [
      "🕌 Bu hafta topluluk olarak 1,234 namaz kıldık!",
      "📖 567 kişi Kuran okuma hedefine ulaştı!",
      "🤲 891 kişi dua rutinini sürdürüyor!",
    ],
    hayvanseverlik: [
      "🐱 Bu hafta 2,345 sokak hayvanı beslenme kaydı yapıldı!",
      "❤️ 456 kişi hayvan barınağına bağış yaptı!",
      "🐕 789 kişi evcil hayvan bakım rutinini tamamladı!",
    ],
    cevre: [
      "🌱 Bu hafta 3,456 kişi plastik kullanmama hedefine ulaştı!",
      "♻️ 1,234 geri dönüşüm aktivitesi kaydedildi!",
      "💧 567 kişi su tasarrufu hedeflerini gerçekleştirdi!",
    ],
    kariyer: [
      "💼 Bu hafta 2,890 profesyonel hedef tamamlandı!",
      "📚 1,567 kişi yeni beceri öğrenme hedefine ulaştı!",
      "🎯 734 kişi kariyer planlaması yaptı!",
    ],
    saglik: [
      "❤️ Bu hafta 4,123 sağlık aktivitesi gerçekleştirildi!",
      "🏃‍♂️ 2,456 kişi egzersiz rutinini sürdürdü!",
      "🥗 1,789 kişi sağlıklı beslenme hedefine ulaştı!",
    ],
    all: [
      "🎉 Topluluk olarak bu hafta 15,000+ aktivite gerçekleştirdik!",
      "⭐ 8,900+ kullanıcı hedeflerine ulaştı!",
      "🔥 Ortalama günlük aktivite %25 arttı!",
    ],
  };

  return messages[category] || messages.all;
}

// Helper function to calculate user rank
async function calculateUserRank(userId, period) {
  // Calculate based on total activities in the period
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
    default:
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
  }

  // Get user's activity count
  const userActivityCount = await prisma.userActivity.count({
    where: {
      userId,
      timestamp: { gte: startDate, lte: endDate },
    },
  });

  // Get all users' activity counts (simplified ranking)
  const allUsersActivities = await prisma.userActivity.groupBy({
    by: ["userId"],
    where: {
      timestamp: { gte: startDate, lte: endDate },
    },
    _count: { userId: true },
  });

  // Sort by activity count and find user's rank
  const sortedUsers = allUsersActivities.sort(
    (a, b) => b._count.userId - a._count.userId
  );
  const userRank = sortedUsers.findIndex((user) => user.userId === userId) + 1;

  return {
    rank: userRank || sortedUsers.length + 1,
    totalUsers: sortedUsers.length,
    activityCount: userActivityCount,
    percentile: userRank
      ? Math.round((1 - userRank / sortedUsers.length) * 100)
      : 0,
  };
}

// Helper function to generate community insights
function generateCommunityInsights(
  totalTasks,
  totalEvents,
  totalNotes,
  category
) {
  const insights = [];

  // Activity volume insight
  const totalActivities = totalTasks + totalEvents + totalNotes;
  if (totalActivities > 10000) {
    insights.push({
      type: "high_activity",
      message:
        "Topluluk çok aktif! Bu hafta rekor aktivite seviyesine ulaştık.",
      icon: "🚀",
    });
  } else if (totalActivities > 5000) {
    insights.push({
      type: "good_activity",
      message: "Topluluk güzel bir aktivite seviyesinde!",
      icon: "📈",
    });
  }

  // Category-specific insights
  if (category === "dini") {
    insights.push({
      type: "spiritual",
      message: "Manevi gelişim konusunda topluluk olarak ilerliyoruz!",
      icon: "🕌",
    });
  } else if (category === "cevre") {
    insights.push({
      type: "environmental",
      message: "Çevre bilinci konusunda örnek bir topluluk oluyoruz!",
      icon: "🌱",
    });
  } else if (category === "hayvanseverlik") {
    insights.push({
      type: "animal_welfare",
      message: "Hayvan dostlarımız için harika işler yapıyoruz!",
      icon: "🐾",
    });
  }

  // Growth insight
  insights.push({
    type: "growth",
    message: "Her geçen gün daha güçlü bir topluluk oluyoruz!",
    icon: "⭐",
  });

  return insights;
}

// GET /api/community/leaderboard - Topluluk sıralaması
router.get("/leaderboard", authenticateToken, async (req, res) => {
  try {
    const { category = "all", period = "week", limit = 10 } = req.query;

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
      default:
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
    }

    // Get user rankings based on activity
    const userActivities = await prisma.userActivity.groupBy({
      by: ["userId"],
      where: {
        timestamp: { gte: startDate, lte: endDate },
      },
      _count: { userId: true },
    });

    // Get user details for top performers
    const topUserIds = userActivities
      .sort((a, b) => b._count.userId - a._count.userId)
      .slice(0, parseInt(limit))
      .map((user) => user.userId);

    const topUsers = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: {
        id: true,
        displayName: true,
        stats: {
          select: {
            totalTasksCompleted: true,
            totalPrayersPerformed: true,
            currentStreak: true,
          },
        },
      },
    });

    // Combine user data with activity counts
    const leaderboard = topUsers.map((user) => {
      const activityData = userActivities.find((a) => a.userId === user.id);
      return {
        id: user.id,
        displayName: user.displayName || "Anonim Kullanıcı",
        activityCount: activityData?._count.userId || 0,
        totalTasksCompleted: user.stats?.totalTasksCompleted || 0,
        totalPrayersPerformed: user.stats?.totalPrayersPerformed || 0,
        currentStreak: user.stats?.currentStreak || 0,
      };
    });

    // Sort by activity count
    leaderboard.sort((a, b) => b.activityCount - a.activityCount);

    res.json({
      success: true,
      data: {
        period,
        category,
        leaderboard: leaderboard.map((user, index) => ({
          ...user,
          rank: index + 1,
        })),
      },
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({
      success: false,
      error: "Sıralama listesi alınırken bir hata oluştu.",
    });
  }
});

// GET /api/community/achievements - Topluluk başarımları
router.get("/achievements", authenticateToken, async (req, res) => {
  try {
    const achievements = [
      {
        id: "early_bird",
        title: "Erken Kalkan",
        description: "10 gün üst üste sabah 6'dan önce aktivite",
        icon: "🌅",
        rarity: "epic",
        unlockedBy: 234,
      },
      {
        id: "prayer_master",
        title: "Namaz Ustası",
        description: "30 gün kesintisiz namaz kılma",
        icon: "🕌",
        rarity: "legendary",
        unlockedBy: 89,
      },
      {
        id: "animal_friend",
        title: "Hayvan Dostu",
        description: "50 hayvan besleme aktivitesi",
        icon: "🐾",
        rarity: "rare",
        unlockedBy: 456,
      },
      {
        id: "eco_warrior",
        title: "Çevre Savaşçısı",
        description: "100 çevre dostu aktivite",
        icon: "🌱",
        rarity: "epic",
        unlockedBy: 123,
      },
      {
        id: "productivity_king",
        title: "Verimlilik Kralı",
        description: "500 görev tamamlama",
        icon: "👑",
        rarity: "legendary",
        unlockedBy: 67,
      },
    ];

    res.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({
      success: false,
      error: "Başarımlar alınırken bir hata oluştu.",
    });
  }
});

// GET /api/community/trends - Topluluk trendleri
router.get("/trends", authenticateToken, async (req, res) => {
  try {
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

    // Get daily activity trends
    const dailyActivities = await prisma.userActivity.groupBy({
      by: ["timestamp"],
      where: {
        timestamp: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    });

    // Process daily data
    const trends = [];
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];

      const dayActivities = dailyActivities.filter(
        (activity) => activity.timestamp.toISOString().split("T")[0] === dateKey
      );

      const totalActivities = dayActivities.reduce(
        (sum, activity) => sum + activity._count.id,
        0
      );

      trends.push({
        date: dateKey,
        activities: totalActivities,
        dayName: date.toLocaleDateString("tr-TR", { weekday: "short" }),
      });
    }

    // Calculate growth rate
    const firstWeek = trends
      .slice(0, 7)
      .reduce((sum, day) => sum + day.activities, 0);
    const lastWeek = trends
      .slice(-7)
      .reduce((sum, day) => sum + day.activities, 0);
    const growthRate =
      firstWeek > 0 ? ((lastWeek - firstWeek) / firstWeek) * 100 : 0;

    res.json({
      success: true,
      data: {
        period,
        trends,
        insights: {
          growthRate: Math.round(growthRate),
          mostActiveDay: trends.sort((a, b) => b.activities - a.activities)[0],
          averageDaily: Math.round(
            trends.reduce((sum, day) => sum + day.activities, 0) / trends.length
          ),
        },
      },
    });
  } catch (error) {
    console.error("Get trends error:", error);
    res.status(500).json({
      success: false,
      error: "Trendler alınırken bir hata oluştu.",
    });
  }
});

module.exports = router;
