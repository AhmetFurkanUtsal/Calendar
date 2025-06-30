const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const ActivityLogger = require("../services/ActivityLogger");
const { validate, eventSchemas } = require("../middleware/validation");

const prisma = new PrismaClient();

// GET /api/events - Kullanıcının etkinliklerini listele
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = req.query;
    const userId = req.user.id;

    let where = { userId };

    if (category && category !== "all") where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Date range filter
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.startTime = { gte: new Date(startDate) };
    } else if (endDate) {
      where.startTime = { lte: new Date(endDate) };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        reminders: true,
      },
      orderBy: { startTime: "asc" },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.event.count({ where });

    // Log activity
    await ActivityLogger.logActivity(userId, "events_viewed", {
      filter: { category, startDate, endDate },
      results_count: events.length,
    });

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      success: false,
      error: "Etkinlikler alınırken bir hata oluştu.",
    });
  }
});

// POST /api/events - Yeni etkinlik oluştur
router.post(
  "/",
  authenticateToken,
  validate(eventSchemas.create),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { reminders, ...eventData } = req.body;

      const event = await prisma.event.create({
        data: {
          ...eventData,
          userId,
          reminders: reminders
            ? {
                create: reminders.map((reminder) => ({
                  minutesBefore: reminder.minutesBefore,
                  type: reminder.type,
                })),
              }
            : undefined,
        },
        include: { reminders: true },
      });

      // Log activity
      await ActivityLogger.logCalendarAction(userId, "created", event);

      res.status(201).json({
        success: true,
        message: "Etkinlik başarıyla oluşturuldu!",
        data: event,
      });
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({
        success: false,
        error: "Etkinlik oluşturulurken bir hata oluştu.",
      });
    }
  }
);

// GET /api/events/:id - Tek bir etkinliği getir
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await prisma.event.findFirst({
      where: { id, userId },
      include: { reminders: true },
    });

    if (!event) {
      return res
        .status(404)
        .json({ success: false, error: "Etkinlik bulunamadı." });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Get event error:", error);
    res
      .status(500)
      .json({ success: false, error: "Etkinlik alınırken bir hata oluştu." });
  }
});

// PATCH /api/events/:id - Etkinlik güncelle
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Check ownership
    const existingEvent = await prisma.event.findFirst({
      where: { id, userId },
    });

    if (!existingEvent) {
      return res
        .status(404)
        .json({ success: false, error: "Etkinlik bulunamadı." });
    }

    const event = await prisma.event.update({
      where: { id },
      data: updates,
      include: { reminders: true },
    });

    // Log activity
    await ActivityLogger.logCalendarAction(userId, "updated", event);

    res.json({
      success: true,
      message: "Etkinlik başarıyla güncellendi!",
      data: event,
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      success: false,
      error: "Etkinlik güncellenirken bir hata oluştu.",
    });
  }
});

// DELETE /api/events/:id - Etkinlik sil
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const event = await prisma.event.findFirst({
      where: { id, userId },
    });

    if (!event) {
      return res
        .status(404)
        .json({ success: false, error: "Etkinlik bulunamadı." });
    }

    await prisma.event.delete({
      where: { id },
    });

    // Log activity
    await ActivityLogger.logCalendarAction(userId, "deleted", event);

    res.json({
      success: true,
      message: "Etkinlik başarıyla silindi!",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res
      .status(500)
      .json({ success: false, error: "Etkinlik silinirken bir hata oluştu." });
  }
});

// GET /api/events/calendar/month/:year/:month - Aylık takvim görünümü
router.get(
  "/calendar/month/:year/:month",
  authenticateToken,
  async (req, res) => {
    try {
      const { year, month } = req.params;
      const userId = req.user.id;

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);

      const events = await prisma.event.findMany({
        where: {
          userId,
          startTime: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        include: { reminders: true },
        orderBy: { startTime: "asc" },
      });

      // Group events by date
      const eventsByDate = {};
      events.forEach((event) => {
        const dateKey = event.startTime.toISOString().split("T")[0];
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
      });

      res.json({
        success: true,
        data: {
          events: eventsByDate,
          totalEvents: events.length,
          month: parseInt(month),
          year: parseInt(year),
        },
      });
    } catch (error) {
      console.error("Get monthly calendar error:", error);
      res.status(500).json({
        success: false,
        error: "Aylık takvim alınırken bir hata oluştu.",
      });
    }
  }
);

// GET /api/events/upcoming - Yaklaşan etkinlikler
router.get("/upcoming", authenticateToken, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const userId = req.user.id;
    const now = new Date();

    const events = await prisma.event.findMany({
      where: {
        userId,
        startTime: { gte: now },
      },
      include: { reminders: true },
      orderBy: { startTime: "asc" },
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Get upcoming events error:", error);
    res.status(500).json({
      success: false,
      error: "Yaklaşan etkinlikler alınırken bir hata oluştu.",
    });
  }
});

// POST /api/events/:id/reminders - Etkinliğe hatırlatıcı ekle
router.post("/:id/reminders", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { minutesBefore, type } = req.body;

    // Check event ownership
    const event = await prisma.event.findFirst({
      where: { id, userId },
    });

    if (!event) {
      return res
        .status(404)
        .json({ success: false, error: "Etkinlik bulunamadı." });
    }

    const reminder = await prisma.eventReminder.create({
      data: {
        eventId: id,
        minutesBefore,
        type,
      },
    });

    res.status(201).json({
      success: true,
      message: "Hatırlatıcı başarıyla eklendi!",
      data: reminder,
    });
  } catch (error) {
    console.error("Create reminder error:", error);
    res.status(500).json({
      success: false,
      error: "Hatırlatıcı eklenirken bir hata oluştu.",
    });
  }
});

// GET /api/events/calendar-kit - Calendar Kit format'ında events
router.get("/calendar-kit", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, resourceId } = req.query;
    const userId = req.user.id;

    let where = { userId };

    // Date range filter for calendar kit
    if (startDate && endDate) {
      where.OR = [
        {
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          endTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          AND: [
            { startTime: { lte: new Date(startDate) } },
            { endTime: { gte: new Date(endDate) } },
          ],
        },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: { reminders: true },
      orderBy: { startTime: "asc" },
    });

    // Transform to Calendar Kit format
    const calendarKitEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.startTime.toISOString(),
      end: event.endTime.toISOString(),
      color: event.color || "#0EA5E9",
      isAllDay: event.isAllDay || false,
      resourceId: resourceId || "default",
      // Additional data for our app
      description: event.description,
      location: event.location,
      category: event.category,
      reminders: event.reminders,
    }));

    res.json({
      success: true,
      data: calendarKitEvents,
    });
  } catch (error) {
    console.error("Get calendar kit events error:", error);
    res.status(500).json({
      success: false,
      error: "Takvim etkinlikleri alınırken bir hata oluştu.",
    });
  }
});

// POST /api/events/calendar-kit - Calendar Kit format'ında event oluştur
router.post("/calendar-kit", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, title, start, end, color, isAllDay, resourceId, ...extraData } =
      req.body;

    const eventData = {
      id: id || undefined, // Let Prisma generate if not provided
      title,
      startTime: new Date(start),
      endTime: new Date(end),
      color: color || "#0EA5E9",
      isAllDay: isAllDay || false,
      userId,
      // Map extra data
      description: extraData.description || "",
      location: extraData.location || "",
      category: extraData.category || "kisisel",
    };

    const event = await prisma.event.create({
      data: eventData,
      include: { reminders: true },
    });

    // Log activity
    await ActivityLogger.logCalendarAction(userId, "created", event);

    // Return in Calendar Kit format
    const calendarKitEvent = {
      id: event.id,
      title: event.title,
      start: event.startTime.toISOString(),
      end: event.endTime.toISOString(),
      color: event.color,
      isAllDay: event.isAllDay,
      resourceId: resourceId || "default",
      description: event.description,
      location: event.location,
      category: event.category,
    };

    res.status(201).json({
      success: true,
      message: "Etkinlik başarıyla oluşturuldu!",
      data: calendarKitEvent,
    });
  } catch (error) {
    console.error("Create calendar kit event error:", error);
    res.status(500).json({
      success: false,
      error: "Etkinlik oluşturulurken bir hata oluştu.",
    });
  }
});

// PATCH /api/events/calendar-kit/:id - Calendar Kit format'ında event güncelle
router.patch("/calendar-kit/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, start, end, color, isAllDay, ...extraData } = req.body;

    // Check ownership
    const existingEvent = await prisma.event.findFirst({
      where: { id, userId },
    });

    if (!existingEvent) {
      return res
        .status(404)
        .json({ success: false, error: "Etkinlik bulunamadı." });
    }

    const updateData = {
      ...(title && { title }),
      ...(start && { startTime: new Date(start) }),
      ...(end && { endTime: new Date(end) }),
      ...(color && { color }),
      ...(isAllDay !== undefined && { isAllDay }),
      ...(extraData.description && { description: extraData.description }),
      ...(extraData.location && { location: extraData.location }),
      ...(extraData.category && { category: extraData.category }),
    };

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: { reminders: true },
    });

    // Log activity
    await ActivityLogger.logCalendarAction(userId, "updated", event);

    // Return in Calendar Kit format
    const calendarKitEvent = {
      id: event.id,
      title: event.title,
      start: event.startTime.toISOString(),
      end: event.endTime.toISOString(),
      color: event.color,
      isAllDay: event.isAllDay,
      description: event.description,
      location: event.location,
      category: event.category,
    };

    res.json({
      success: true,
      message: "Etkinlik başarıyla güncellendi!",
      data: calendarKitEvent,
    });
  } catch (error) {
    console.error("Update calendar kit event error:", error);
    res.status(500).json({
      success: false,
      error: "Etkinlik güncellenirken bir hata oluştu.",
    });
  }
});

module.exports = router;
