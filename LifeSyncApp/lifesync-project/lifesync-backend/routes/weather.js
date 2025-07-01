const express = require("express");
const router = express.Router();
const axios = require("axios");
const checkEnv = require("../check-env"); // check-env modülünü import et

// Ortam değişkenlerini kontrol et
checkEnv("WEATHER_API_KEY");

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = "http://api.weatherapi.com/v1";

/**
 * @route   GET /api/weather
 * @desc    Get current weather for a city
 * @access  Public
 */
router.get("/", async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res
      .status(400)
      .json({ success: false, error: "City query parameter is required" });
  }

  try {
    const weatherResponse = await axios.get(`${BASE_URL}/forecast.json`, {
      params: {
        key: WEATHER_API_KEY,
        q: city,
        days: 1, // Sadece bugün için tahmin
        lang: "tr", // Dili Türkçe olarak ayarlıyoruz
        aqi: "yes", // Air quality index de dahil et
      },
    });

    const data = weatherResponse.data;

    // Gelen ham API yanıtını logla
    console.log("WeatherAPI Raw Response:", JSON.stringify(data, null, 2));

    // Frontend için veriyi sadeleştiriyoruz
    const formattedData = {
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
      },
      current: {
        temp_c: data.current.temp_c,
        is_day: data.current.is_day,
        condition: {
          text: data.current.condition.text,
          icon: data.current.condition.icon,
          code: data.current.condition.code,
        },
        wind_kph: data.current.wind_kph,
        humidity: data.current.humidity,
        feelslike_c: data.current.feelslike_c,
        uv: data.current.uv, // UV index eklendi
        air_quality: data.current.air_quality
          ? {
              co: data.current.air_quality.co,
              no2: data.current.air_quality.no2,
              o3: data.current.air_quality.o3,
              so2: data.current.air_quality.so2,
              pm2_5: data.current.air_quality.pm2_5,
              pm10: data.current.air_quality.pm10,
              us_epa_index: data.current.air_quality["us-epa-index"],
              gb_defra_index: data.current.air_quality["gb-defra-index"],
            }
          : null,
      },
      // Günlük min/max sıcaklıklar eklendi
      forecast: {
        mintemp_c: data.forecast.forecastday[0].day.mintemp_c,
        maxtemp_c: data.forecast.forecastday[0].day.maxtemp_c,
        avgtemp_c: data.forecast.forecastday[0].day.avgtemp_c,
      },
    };

    console.log("✅ Weather API Response with Min/Max:", {
      city: formattedData.location.name,
      temp: formattedData.current.temp_c,
      min: formattedData.forecast.mintemp_c,
      max: formattedData.forecast.maxtemp_c,
      uv: formattedData.current.uv,
      condition: formattedData.current.condition.text,
    });

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error(
      "Weather API error:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch weather data" });
  }
});

module.exports = router;
