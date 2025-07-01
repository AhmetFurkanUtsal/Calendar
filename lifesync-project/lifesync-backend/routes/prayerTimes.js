const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const ActivityLogger = require("../services/ActivityLogger");
const axios = require("axios");

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

// Namaz vakitleri için Afyon Sandıklı koordinatları
const AFYON_SANDIKLI = {
  lat: 38.4667,
  lng: 30.2667,
  name: "Afyon Sandıklı",
};

// GET /api/prayer-times - Günlük namaz vakitleri
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { date, city } = req.query;
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Şimdilik sadece Afyon Sandıklı için
    const location = AFYON_SANDIKLI;

    // Namaz vakti API'sinden veri çek
    const response = await axios.get(
      `https://vakit.vercel.app/api/timesForGPS?lat=${location.lat}&lng=${location.lng}&timezoneOffset=180&lang=tr`
    );

    console.log("🕌 Prayer Times API Response:", response.data);

    const prayerData = response.data;

    // API response formatını kontrol et
    if (!prayerData || !prayerData.times) {
      throw new Error(
        "Namaz vakitleri API'sinden geçersiz veri formatı alındı"
      );
    }

    // Bugünkü tarihi al veya belirtilen tarihi kullan
    const todayTimes =
      prayerData.times[targetDate] || Object.values(prayerData.times)[0];

    if (!todayTimes || !Array.isArray(todayTimes) || todayTimes.length < 6) {
      throw new Error("Namaz vakitleri API'sinden eksik veri alındı");
    }

    // Array formatından object formatına dönüştür
    // [İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı]
    const prayerTimes = {
      location: prayerData.place?.name || location.name,
      date: targetDate,
      times: {
        imsak: todayTimes[0],
        gunes: todayTimes[1],
        ogle: todayTimes[2],
        ikindi: todayTimes[3],
        aksam: todayTimes[4],
        yatsi: todayTimes[5],
      },
      hijriDate: formatHijriDate(),
      nextPrayer: getNextPrayer(todayTimes),
      place: prayerData.place,
    };

    console.log("🕌 Formatted Prayer Times:", prayerTimes);

    res.json({
      success: true,
      data: prayerTimes,
    });
  } catch (error) {
    console.error("❌ Prayer times fetch error:", error.message);

    // Hiçbir statik fallback yok - sadece hata mesajı
    res.status(500).json({
      success: false,
      error: "Namaz vakitleri alınamadı",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Sonraki namaz vaktini hesapla (Array formatı için)
function getNextPrayer(prayerTimesArray) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Prayer names ve times
  const prayers = [
    { name: "İmsak", time: prayerTimesArray[0] },
    { name: "Güneş", time: prayerTimesArray[1] },
    { name: "Öğle", time: prayerTimesArray[2] },
    { name: "İkindi", time: prayerTimesArray[3] },
    { name: "Akşam", time: prayerTimesArray[4] },
    { name: "Yatsı", time: prayerTimesArray[5] },
  ];

  console.log("🕌 Processed prayers from array:", prayers);

  for (let prayer of prayers) {
    // Time string kontrolü
    if (!prayer.time || typeof prayer.time !== "string") {
      console.log(`⚠️ Invalid time for ${prayer.name}:`, prayer.time);
      continue;
    }

    const timeParts = prayer.time.split(":");
    if (timeParts.length !== 2) {
      console.log(`⚠️ Invalid time format for ${prayer.name}:`, prayer.time);
      continue;
    }

    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);

    if (isNaN(hours) || isNaN(minutes)) {
      console.log(`⚠️ Invalid time numbers for ${prayer.name}:`, prayer.time);
      continue;
    }

    const prayerTime = hours * 60 + minutes;

    if (currentTime < prayerTime) {
      const timeLeft = prayerTime - currentTime;
      const hoursLeft = Math.floor(timeLeft / 60);
      const minutesLeft = timeLeft % 60;

      return {
        name: prayer.name,
        time: prayer.time,
        timeLeft: `${hoursLeft}:${minutesLeft.toString().padStart(2, "0")}`,
      };
    }
  }

  // Eğer gün bitti, yarınki ilk namaz (İmsak)
  return {
    name: "İmsak",
    time: prayers[0].time,
    timeLeft: "Yarın",
  };
}

// Basit Hijri tarih formatı (yaklaşık)
function formatHijriDate() {
  const now = new Date();
  const hijriYear = now.getFullYear() - 579; // Yaklaşık dönüşüm
  const months = [
    "Muharrem",
    "Safer",
    "Rebiyülev",
    "Rebiyülahhir",
    "Cemaziyelvev",
    "Cemazülahhir",
    "Recep",
    "Şaban",
    "Ramazan",
    "Şeval",
    "Zilkade",
    "Zilhicce",
  ];
  const month = months[now.getMonth()];
  return `${now.getDate()} ${month} ${hijriYear}`;
}

// POST /api/prayer-times/complete - Namaz kılındı olarak işaretle
router.post("/complete", authenticateToken, async (req, res) => {
  try {
    const { prayerName, prayerTime, completedAt } = req.body;
    const userId = req.user.id;

    // Log prayer activity
    await ActivityLogger.logPrayer(userId, prayerName, prayerTime);

    // Update user stats - total prayers performed
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalPrayersPerformed: { increment: 1 },
      },
      create: {
        userId,
        totalPrayersPerformed: 1,
      },
    });

    res.json({
      success: true,
      message: `${prayerName} namazı kaydedildi`,
    });
  } catch (error) {
    console.error("Prayer completion error:", error);
    res.status(500).json({
      success: false,
      error: "Namaz kaydedilemedi",
    });
  }
});

module.exports = router;
