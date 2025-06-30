const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const ActivityLogger = require("../services/ActivityLogger");

const prisma = new PrismaClient();

// Namaz Vakti API Servisi (vakit.vercel.app)
class PrayerTimesService {
  constructor() {
    this.baseURL = "https://vakit.vercel.app/api";
  }

  /**
   * Verilen enlem ve boylama göre namaz vakitlerini getirir.
   */
  async getTimesByGPS(lat, lng) {
    try {
      const url = `${this.baseURL}/timesForGPS?lat=${lat}&lng=${lng}&timezoneOffset=180&lang=tr`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();

      if (!data || !data.times || !data.place) {
        throw new Error("Invalid response from prayer times API");
      }

      const today = new Date().toISOString().split("T")[0];
      const todayTimes = data.times[today];

      if (!todayTimes || todayTimes.length < 6) {
        throw new Error("Prayer times not available for today");
      }

      return {
        place: {
          name: data.place.name,
          state: data.place.stateName,
          country: data.place.country,
        },
        timings: {
          imsak: todayTimes[0],
          gunes: todayTimes[1],
          ogle: todayTimes[2],
          ikindi: todayTimes[3],
          aksam: todayTimes[4],
          yatsi: todayTimes[5],
        },
      };
    } catch (error) {
      console.error("Error fetching prayer times by GPS:", error);
      throw error;
    }
  }

  /**
   * Şehir adına göre arama yapar ve ilk sonucu kullanarak namaz vakitlerini getirir.
   */
  async getTimesByCity(cityName) {
    try {
      const searchUrl = `${this.baseURL}/searchPlaces?q=${encodeURIComponent(
        cityName
      )}&lang=tr`;
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok)
        throw new Error(`API Error: ${searchResponse.status}`);
      const places = await searchResponse.json();

      if (!places || places.length === 0) {
        throw new Error(`Place not found: ${cityName}`);
      }

      const firstPlace = places[0];
      return await this.getTimesByGPS(
        firstPlace.latitude,
        firstPlace.longitude
      );
    } catch (error) {
      console.error("Error fetching prayer times by city:", error);
      throw error;
    }
  }

  /**
   * Mevcut ve bir sonraki namaz vaktini hesaplar.
   */
  getCurrentPrayerInfo(timings) {
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: "imsak", time: timings.imsak, displayName: "İmsak" },
      { name: "gunes", time: timings.gunes, displayName: "Güneş" },
      { name: "ogle", time: timings.ogle, displayName: "Öğle" },
      { name: "ikindi", time: timings.ikindi, displayName: "İkindi" },
      { name: "aksam", time: timings.aksam, displayName: "Akşam" },
      { name: "yatsi", time: timings.yatsi, displayName: "Yatsı" },
    ];

    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const prayerMinutes = prayers.map((p) => ({
      ...p,
      minutes: timeToMinutes(p.time),
    }));

    let currentPrayer = null;
    let nextPrayer = prayerMinutes[0];

    for (let i = 0; i < prayerMinutes.length; i++) {
      if (currentTimeInMinutes >= prayerMinutes[i].minutes) {
        currentPrayer = prayerMinutes[i];
        nextPrayer = prayerMinutes[i + 1] || prayerMinutes[0]; // Döngü
      } else {
        nextPrayer = prayerMinutes[i];
        break;
      }
    }

    // Güneş vaktini "sıradaki vakit" olarak gösterme, bir sonrakini göster.
    if (nextPrayer && nextPrayer.name === "gunes") {
      const gunesIndex = prayerMinutes.findIndex((p) => p.name === "gunes");
      nextPrayer = prayerMinutes[gunesIndex + 1] || prayerMinutes[0];
    }

    let timeToNext = null;
    if (nextPrayer) {
      let diff = nextPrayer.minutes - currentTimeInMinutes;
      if (diff < 0) diff += 24 * 60; // Ertesi gün
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      timeToNext = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }

    return { current: currentPrayer, next: nextPrayer, timeToNext };
  }
}

const prayerTimesService = new PrayerTimesService();

// Middleware to check if user has religious lifestyle
const requireReligiousLifestyle = (req, res, next) => {
  const userLifestyle = req.user?.lifestyle?.categories || [];
  if (!userLifestyle.includes("dini")) {
    return res.status(403).json({
      success: false,
      error:
        "Bu özellik sadece dini yaşam tarzını seçen kullanıcılar için mevcut.",
    });
  }
  next();
};

/**
 * @route   GET /api/prayer-times/today
 * @desc    Get today's prayer times by city or GPS coordinates.
 * @access  Private (requires token and 'dini' lifestyle)
 */
router.get(
  "/today",
  authenticateToken,
  requireReligiousLifestyle,
  async (req, res) => {
    try {
      const { lat, lng } = req.query;
      const city = req.user.profile?.city;

      if (!lat && !lng && !city) {
        return res.status(400).json({
          success: false,
          error: "Konum bilgisi (city veya lat/lng) eksik.",
        });
      }

      let prayerData;
      if (lat && lng) {
        prayerData = await prayerTimesService.getTimesByGPS(
          parseFloat(lat),
          parseFloat(lng)
        );
      } else {
        prayerData = await prayerTimesService.getTimesByCity(city);
      }

      const currentInfo = prayerTimesService.getCurrentPrayerInfo(
        prayerData.timings
      );

      await ActivityLogger.logActivity(req.user.id, "prayer_times_viewed", {
        city: prayerData.place.name,
        source: "vakit.vercel.app",
      });

      res.json({
        success: true,
        data: {
          place: prayerData.place,
          timings: prayerData.timings,
          currentInfo,
        },
      });
    } catch (error) {
      console.error("Get prayer times error:", error.message);
      res.status(500).json({
        success: false,
        error: "Namaz vakitleri alınamadı.",
        details: error.message,
      });
    }
  }
);

module.exports = router;
