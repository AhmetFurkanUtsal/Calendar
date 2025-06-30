const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const ActivityLogger = require("../services/ActivityLogger");
const { validate, taskSchemas } = require("../middleware/validation");

const prisma = new PrismaClient();

// GET /api/tasks - Kullanıcının görevlerini listele
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      category,
      priority,
      status,
      search,
      eisenhower,
      page = 1,
      limit = 20,
    } = req.query;
    const userId = req.user.id;

    let where = { userId };

    if (category && category !== "all") where.category = category;
    if (priority && priority !== "all") where.priority = priority;
    if (status === "completed") where.isCompleted = true;
    if (status === "pending") where.isCompleted = false;
    if (eisenhower) where.eisenhowerQuadrant = parseInt(eisenhower);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        subtasks: true,
        attachments: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.task.count({ where });

    // Log activity
    await ActivityLogger.logActivity(userId, "tasks_viewed", {
      filter: { category, priority, status, eisenhower },
      results_count: tasks.length,
    });

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res
      .status(500)
      .json({ success: false, error: "Görevler alınırken bir hata oluştu." });
  }
});

// POST /api/tasks - Yeni görev oluştur
router.post(
  "/",
  authenticateToken,
  validate(taskSchemas.create),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { subtasks, ...taskData } = req.body;

      const task = await prisma.task.create({
        data: {
          ...taskData,
          userId,
          subtasks: subtasks
            ? {
                create: subtasks,
              }
            : undefined,
        },
        include: { subtasks: true },
      });

      // Update user stats
      await prisma.userStats.update({
        where: { userId },
        data: { totalTasksCreated: { increment: 1 } },
      });

      // Log activity
      await ActivityLogger.logTaskAction(userId, "created", task);

      res.status(201).json({
        success: true,
        message: "Görev başarıyla oluşturuldu!",
        data: task,
      });
    } catch (error) {
      console.error("Create task error:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Görev oluşturulurken bir hata oluştu.",
        });
    }
  }
);

// POST /api/tasks/preset - Preset görevden oluştur
router.post("/preset", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { presetTaskId } = req.body;

    // Get preset task
    const presetTask = await prisma.presetTask.findUnique({
      where: { id: presetTaskId },
    });

    if (!presetTask) {
      return res.status(404).json({
        success: false,
        error: "Preset görev bulunamadı.",
      });
    }

    // Create task from preset
    const task = await prisma.task.create({
      data: {
        userId,
        title: presetTask.title,
        description: presetTask.description,
        category: presetTask.category,
        priority: presetTask.priority,
        isPresetTask: true,
        presetTaskId: presetTask.id,
      },
    });

    // Update preset usage count
    await prisma.presetTask.update({
      where: { id: presetTaskId },
      data: { usageCount: { increment: 1 } },
    });

    // Log activity
    await ActivityLogger.logPresetTaskUsage(
      userId,
      presetTaskId,
      presetTask.category
    );

    res.status(201).json({
      success: true,
      message: "Görev hazır şablondan oluşturuldu!",
      data: task,
    });
  } catch (error) {
    console.error("Create task from preset error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Preset görev oluşturulurken bir hata oluştu.",
      });
  }
});

// GET /api/tasks/preset - Preset görevleri listele
router.get("/preset", authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    const userCategories = req.user.lifestyle?.categories || [];

    let where = { isActive: true };

    // Filter by user's lifestyle categories
    if (category) {
      where.category = category;
    } else {
      where.category = { in: userCategories.map((c) => c.toUpperCase()) };
    }

    const presetTasks = await prisma.presetTask.findMany({
      where,
      orderBy: [{ isPromoted: "desc" }, { usageCount: "desc" }],
    });

    res.json({
      success: true,
      data: presetTasks,
    });
  } catch (error) {
    console.error("Get preset tasks error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Preset görevler alınırken bir hata oluştu.",
      });
  }
});

// GET /api/tasks/:id - Tek bir görevi getir
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findFirst({
      where: { id, userId },
      include: {
        subtasks: true,
        attachments: true,
      },
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, error: "Görev bulunamadı." });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Get task error:", error);
    res
      .status(500)
      .json({ success: false, error: "Görev alınırken bir hata oluştu." });
  }
});

// PATCH /api/tasks/:id - Görev güncelle
router.patch(
  "/:id",
  authenticateToken,
  validate(taskSchemas.update),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Check ownership
      const existingTask = await prisma.task.findFirst({
        where: { id, userId },
      });

      if (!existingTask) {
        return res
          .status(404)
          .json({ success: false, error: "Görev bulunamadı." });
      }

      const task = await prisma.task.update({
        where: { id },
        data: updates,
        include: { subtasks: true },
      });

      // If task completed, update stats
      if (updates.isCompleted && !existingTask.isCompleted) {
        await prisma.task.update({
          where: { id },
          data: { completedAt: new Date() },
        });

        await prisma.userStats.update({
          where: { userId },
          data: {
            totalTasksCompleted: { increment: 1 },
            currentStreak: { increment: 1 },
          },
        });

        await ActivityLogger.logTaskAction(userId, "completed", task);
      } else {
        await ActivityLogger.logTaskAction(userId, "updated", task);
      }

      res.json({
        success: true,
        message: "Görev başarıyla güncellendi!",
        data: task,
      });
    } catch (error) {
      console.error("Update task error:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Görev güncellenirken bir hata oluştu.",
        });
    }
  }
);

// DELETE /api/tasks/:id - Görev sil
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const task = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, error: "Görev bulunamadı." });
    }

    await prisma.task.delete({
      where: { id },
    });

    // Log activity
    await ActivityLogger.logTaskAction(userId, "deleted", task);

    res.json({
      success: true,
      message: "Görev başarıyla silindi!",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res
      .status(500)
      .json({ success: false, error: "Görev silinirken bir hata oluştu." });
  }
});

// POST /api/tasks/:id/subtasks - Alt görev ekle
router.post("/:id/subtasks", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title } = req.body;

    // Check task ownership
    const task = await prisma.task.findFirst({
      where: { id, userId },
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, error: "Görev bulunamadı." });
    }

    const subtask = await prisma.subtask.create({
      data: {
        taskId: id,
        title,
      },
    });

    res.status(201).json({
      success: true,
      message: "Alt görev başarıyla eklendi!",
      data: subtask,
    });
  } catch (error) {
    console.error("Create subtask error:", error);
    res
      .status(500)
      .json({ success: false, error: "Alt görev eklenirken bir hata oluştu." });
  }
});

// PATCH /api/tasks/:taskId/subtasks/:subtaskId - Alt görev güncelle
router.patch(
  "/:taskId/subtasks/:subtaskId",
  authenticateToken,
  async (req, res) => {
    try {
      const { taskId, subtaskId } = req.params;
      const userId = req.user.id;
      const { isCompleted } = req.body;

      // Check task ownership
      const task = await prisma.task.findFirst({
        where: { id: taskId, userId },
      });

      if (!task) {
        return res
          .status(404)
          .json({ success: false, error: "Görev bulunamadı." });
      }

      const subtask = await prisma.subtask.update({
        where: { id: subtaskId },
        data: {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });

      res.json({
        success: true,
        message: "Alt görev başarıyla güncellendi!",
        data: subtask,
      });
    } catch (error) {
      console.error("Update subtask error:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Alt görev güncellenirken bir hata oluştu.",
        });
    }
  }
);

// GET /api/tasks/eisenhower/matrix - Eisenhower Matrix görünümü
router.get("/eisenhower/matrix", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        isCompleted: false,
      },
      include: { subtasks: true },
      orderBy: { createdAt: "desc" },
    });

    // Group by Eisenhower quadrants
    const matrix = {
      1: tasks.filter((t) => t.eisenhowerQuadrant === 1), // Urgent & Important
      2: tasks.filter((t) => t.eisenhowerQuadrant === 2), // Important & Not Urgent
      3: tasks.filter((t) => t.eisenhowerQuadrant === 3), // Urgent & Not Important
      4: tasks.filter((t) => t.eisenhowerQuadrant === 4), // Not Urgent & Not Important
      unassigned: tasks.filter((t) => !t.eisenhowerQuadrant),
    };

    res.json({
      success: true,
      data: matrix,
    });
  } catch (error) {
    console.error("Get Eisenhower matrix error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Eisenhower matrix alınırken bir hata oluştu.",
      });
  }
});

module.exports = router;
