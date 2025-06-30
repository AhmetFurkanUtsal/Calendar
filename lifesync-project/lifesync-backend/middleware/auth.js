const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access token gerekli.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        subscription: true,
        stats: true,
        lifestyle: true,
        profile: true,
      },
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        error: "Geçersiz token.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: "Token geçersiz veya süresi dolmuş.",
    });
  }
};

// Check subscription plan
const requireSubscription = (requiredPlan) => {
  return (req, res, next) => {
    const userPlan = req.user?.subscription?.plan || "FREE";

    const planHierarchy = {
      FREE: 0,
      PREMIUM: 1,
      PRO: 2,
    };

    if (planHierarchy[userPlan] >= planHierarchy[requiredPlan]) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: `Bu özellik için ${requiredPlan} veya üstü plan gerekli.`,
        requiredPlan,
        currentPlan: userPlan,
      });
    }
  };
};

// Rate limiting for AI features
const aiRateLimit = async (req, res, next) => {
  const userId = req.user.id;
  const userStats = req.user.stats;
  const plan = req.user.subscription?.plan || "FREE";

  const limits = {
    FREE: 10,
    PREMIUM: 100,
    PRO: -1, // Unlimited
  };

  const limit = limits[plan];

  if (limit === -1) {
    return next(); // Unlimited for PRO
  }

  // Check if daily limit exceeded
  const today = new Date().toISOString().split("T")[0];

  if (userStats?.lastResetDate !== today) {
    // Reset daily counters
    await prisma.userStats.update({
      where: { userId },
      data: {
        dailyAIRequests: 0,
        dailyWeatherRequests: 0,
        dailyVoiceNotes: 0,
        lastResetDate: today,
      },
    });
    return next();
  }

  if (userStats?.dailyAIRequests >= limit) {
    return res.status(429).json({
      success: false,
      error: `Günlük AI kullanım limitinize ulaştınız (${limit} istek).`,
      limit,
      used: userStats.dailyAIRequests,
      resetAt: new Date().setHours(24, 0, 0, 0),
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireSubscription,
  aiRateLimit,
};
