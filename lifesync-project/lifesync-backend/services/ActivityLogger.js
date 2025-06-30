const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ActivityLogger {
  // LOG KAYIT ALMA - KULLANICI AKTİVİTE TAKİP SİSTEMİ (ÖZEL İSTEK)
  async logActivity(userId, action, details = {}, deviceInfo = {}) {
    try {
      await prisma.userActivity.create({
        data: {
          userId,
          action,
          details,
          deviceInfo,
          sessionId: details.sessionId || null,
          platform: deviceInfo.platform || "unknown",
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Activity logging failed:", error);
      // Loglama hatası uygulamayı durdurmamalı
    }
  }

  // Screen view tracking
  async logScreenView(userId, screenName, params = {}) {
    await this.logActivity(userId, "screen_view", {
      screen_name: screenName,
      ...params,
    });
  }

  // Task actions
  async logTaskAction(userId, action, taskData) {
    await this.logActivity(userId, `task_${action}`, {
      task_id: taskData.id,
      task_title: taskData.title,
      task_category: taskData.category,
      task_priority: taskData.priority,
      eisenhower_quadrant: taskData.eisenhowerQuadrant,
    });
  }

  // Calendar actions
  async logCalendarAction(userId, action, eventData) {
    await this.logActivity(userId, `calendar_${action}`, {
      event_id: eventData.id,
      event_title: eventData.title,
      event_date: eventData.startTime,
      event_category: eventData.category,
    });
  }

  // Note actions
  async logNoteAction(userId, action, noteData) {
    await this.logActivity(userId, `note_${action}`, {
      note_id: noteData.id,
      note_title: noteData.title,
      note_category: noteData.category,
      has_voice_note: noteData.voiceNotes?.length > 0,
    });
  }

  // AI interactions
  async logAIInteraction(userId, prompt, response, type = "text") {
    await this.logActivity(userId, "ai_interaction", {
      prompt: prompt.substring(0, 100), // İlk 100 karakter
      response_length: response.length,
      interaction_type: type,
      timestamp: new Date(),
    });
  }

  // Voice note usage
  async logVoiceNote(userId, duration, transcriptionSuccess) {
    await this.logActivity(userId, "voice_note_created", {
      duration_seconds: duration,
      transcription_success: transcriptionSuccess,
      timestamp: new Date(),
    });
  }

  // Prayer tracking (dini kategori için özel)
  async logPrayer(userId, prayerName, prayerTime) {
    await this.logActivity(userId, "prayer_performed", {
      prayer_name: prayerName,
      prayer_time: prayerTime,
      category: "dini",
    });
  }

  // Social feature usage
  async logCommunityStatsView(userId, category) {
    await this.logActivity(userId, "community_stats_viewed", {
      category,
      timestamp: new Date(),
    });
  }

  // Weather widget usage
  async logWeatherRequest(userId, location) {
    await this.logActivity(userId, "weather_requested", {
      location,
      timestamp: new Date(),
    });
  }

  // Preset task usage
  async logPresetTaskUsage(userId, presetTaskId, taskCategory) {
    await this.logActivity(userId, "preset_task_used", {
      preset_task_id: presetTaskId,
      category: taskCategory,
      timestamp: new Date(),
    });
  }

  // Login/Logout tracking
  async logAuth(userId, action, deviceInfo = {}) {
    await this.logActivity(
      userId,
      `auth_${action}`,
      {
        timestamp: new Date(),
        ip_address: deviceInfo.ip,
        user_agent: deviceInfo.userAgent,
      },
      deviceInfo
    );
  }

  // Get user activity analytics
  async getUserActivitySummary(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await prisma.userActivity.findMany({
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: "desc" },
    });

    // Activity summary
    const summary = {
      total_activities: activities.length,
      screens_visited: [
        ...new Set(
          activities
            .filter((a) => a.action === "screen_view")
            .map((a) => a.details.screen_name)
        ),
      ].length,
      tasks_created: activities.filter((a) => a.action === "task_created")
        .length,
      tasks_completed: activities.filter((a) => a.action === "task_completed")
        .length,
      notes_created: activities.filter((a) => a.action === "note_created")
        .length,
      ai_interactions: activities.filter((a) => a.action === "ai_interaction")
        .length,
      voice_notes: activities.filter((a) => a.action === "voice_note_created")
        .length,
      prayers_logged: activities.filter((a) => a.action === "prayer_performed")
        .length,
      community_views: activities.filter(
        (a) => a.action === "community_stats_viewed"
      ).length,
      weather_requests: activities.filter(
        (a) => a.action === "weather_requested"
      ).length,
      most_active_day: this.getMostActiveDay(activities),
      daily_activity: this.getDailyActivityBreakdown(activities),
      hourly_pattern: this.getHourlyActivityPattern(activities),
      category_breakdown: this.getCategoryBreakdown(activities),
      device_breakdown: this.getDeviceBreakdown(activities),
    };

    return summary;
  }

  getMostActiveDay(activities) {
    const dayCount = {};
    activities.forEach((activity) => {
      const day = activity.timestamp.toLocaleDateString();
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    return (
      Object.entries(dayCount).sort(([, a], [, b]) => b - a)[0]?.[0] || null
    );
  }

  getDailyActivityBreakdown(activities) {
    const daily = {};
    activities.forEach((activity) => {
      const date = activity.timestamp.toISOString().split("T")[0];
      if (!daily[date]) daily[date] = 0;
      daily[date]++;
    });
    return daily;
  }

  getHourlyActivityPattern(activities) {
    const hourly = Array(24).fill(0);
    activities.forEach((activity) => {
      const hour = activity.timestamp.getHours();
      hourly[hour]++;
    });
    return hourly;
  }

  getCategoryBreakdown(activities) {
    const categories = {};
    activities.forEach((activity) => {
      const category =
        activity.details?.task_category ||
        activity.details?.event_category ||
        activity.details?.note_category ||
        "other";
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  getDeviceBreakdown(activities) {
    const devices = {};
    activities.forEach((activity) => {
      const platform = activity.platform || "unknown";
      devices[platform] = (devices[platform] || 0) + 1;
    });
    return devices;
  }

  // Get activity heatmap data
  async getActivityHeatmap(userId, days = 365) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await prisma.userActivity.groupBy({
      by: ["timestamp"],
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      _count: true,
    });

    const heatmap = {};
    activities.forEach((day) => {
      const date = day.timestamp.toISOString().split("T")[0];
      heatmap[date] = day._count;
    });

    return heatmap;
  }

  // Get most used features
  async getMostUsedFeatures(userId, limit = 10) {
    const activities = await prisma.userActivity.groupBy({
      by: ["action"],
      where: { userId },
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: "desc",
        },
      },
      take: limit,
    });

    return activities.map((a) => ({
      action: a.action,
      count: a._count.action,
    }));
  }
}

module.exports = new ActivityLogger();
