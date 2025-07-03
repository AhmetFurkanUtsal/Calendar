const express = require("express");
const router = express.Router();
const axios = require("axios");
const { authenticateToken } = require("../middleware/auth");
const ActivityLogger = require("../services/ActivityLogger");

// Nager.Date API base URL
const NAGER_API_BASE = "https://date.nager.at/api/v3";

/**
 * @route   GET /api/holidays/turkey/:year
 * @desc    Get Turkey public holidays for specific year from Nager.Date API
 * @access  Public
 */
router.get("/turkey/:year", async (req, res) => {
  try {
    const { year } = req.params;
    
    // Yıl validasyonu
    const currentYear = new Date().getFullYear();
    const requestedYear = parseInt(year);
    
    if (requestedYear < 2020 || requestedYear > currentYear + 5) {
      return res.status(400).json({
        success: false,
        error: `Geçerli yıl aralığı: 2020-${currentYear + 5}`,
      });
    }

    console.log(`🏛️ Fetching Turkey holidays for year: ${year}`);

    // Nager.Date API'den Türkiye tatillerini çek
    const response = await axios.get(
      `${NAGER_API_BASE}/PublicHolidays/${year}/TR`,
      {
        timeout: 10000,
        headers: {
          "User-Agent": "LifeSync-Calendar-App",
        },
      }
    );

    const holidays = response.data;

    if (!holidays || !Array.isArray(holidays)) {
      throw new Error("Invalid response from Nager.Date API");
    }

    // Response'u LifeSync formatına dönüştür
    const formattedHolidays = holidays.map((holiday) => ({
      date: holiday.date,
      name: holiday.localName || holiday.name,
      englishName: holiday.name,
      type: holiday.types.includes("Public") ? "national" : "observance",
      global: holiday.global,
      color: holiday.types.includes("Public") ? "#EF4444" : "#F59E0B",
      counties: holiday.counties,
      launchYear: holiday.launchYear,
    }));

    console.log(`✅ Found ${formattedHolidays.length} holidays for Turkey ${year}`);

    // Activity log (sadece authenticated kullanıcılar için)
    if (req.user) {
      await ActivityLogger.logActivity(req.user.id, "holidays_viewed", {
        country: "Turkey",
        year: requestedYear,
        count: formattedHolidays.length,
        source: "nager.date",
      });
    }

    res.json({
      success: true,
      data: {
        country: "Turkey",
        countryCode: "TR",
        year: requestedYear,
        holidays: formattedHolidays,
        source: "Nager.Date API",
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Turkey holidays fetch error:", error.message);

    // Fallback: Temel Türkiye tatilleri (sadece hata durumunda)
    const fallbackHolidays = [
      {
        date: `${req.params.year}-01-01`,
        name: "Yılbaşı",
        englishName: "New Year's Day",
        type: "national",
        color: "#EF4444",
      },
      {
        date: `${req.params.year}-04-23`,
        name: "Ulusal Egemenlik ve Çocuk Bayramı",
        englishName: "National Sovereignty and Children's Day",
        type: "national",
        color: "#EF4444",
      },
      {
        date: `${req.params.year}-05-01`,
        name: "Emek ve Dayanışma Günü",
        englishName: "Labor and Solidarity Day",
        type: "national",
        color: "#EF4444",
      },
      {
        date: `${req.params.year}-05-19`,
        name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı",
        englishName: "Commemoration of Atatürk, Youth and Sports Day",
        type: "national",
        color: "#EF4444",
      },
      {
        date: `${req.params.year}-08-30`,
        name: "Zafer Bayramı",
        englishName: "Victory Day",
        type: "national",
        color: "#EF4444",
      },
      {
        date: `${req.params.year}-10-29`,
        name: "Cumhuriyet Bayramı",
        englishName: "Republic Day",
        type: "national",
        color: "#EF4444",
      },
    ];

    res.status(500).json({
      success: false,
      error: "Tatil bilgileri alınamadı, fallback data kullanılıyor",
      data: {
        country: "Turkey",
        year: parseInt(req.params.year),
        holidays: fallbackHolidays,
        source: "Fallback data",
        lastUpdated: new Date().toISOString(),
      },
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * @route   GET /api/holidays/turkey/current
 * @desc    Get Turkey holidays for current year
 * @access  Public
 */
router.get("/turkey/current", async (req, res) => {
  const currentYear = new Date().getFullYear();
  req.params.year = currentYear.toString();
  
  // Redirect to main endpoint
  return router.handle(req, res, (err) => {
    if (err) throw err;
  });
});

/**
 * @route   GET /api/holidays/countries
 * @desc    Get available countries from Nager.Date API
 * @access  Public
 */
router.get("/countries", async (req, res) => {
  try {
    const response = await axios.get(`${NAGER_API_BASE}/AvailableCountries`);
    
    const countries = response.data.filter(country => 
      ["TR", "DE", "US", "GB", "FR"].includes(country.countryCode)
    );

    res.json({
      success: true,
      data: countries,
      source: "Nager.Date API",
    });
  } catch (error) {
    console.error("Countries fetch error:", error.message);
    res.status(500).json({
      success: false,
      error: "Ülke listesi alınamadı",
    });
  }
});

module.exports = router; 