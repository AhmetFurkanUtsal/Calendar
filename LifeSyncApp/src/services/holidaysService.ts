import api from './api';

// Android emülatör için API base URL
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api' // Android emülatör
  : 'https://your-production-api.com/api';

export interface Holiday {
  date: string;
  name: string;
  englishName: string;
  type: 'national' | 'observance';
  global: boolean;
  color: string;
  counties?: string[] | null;
  launchYear?: number | null;
}

export interface HolidaysResponse {
  success: boolean;
  data: {
    country: string;
    countryCode: string;
    year: number;
    holidays: Holiday[];
    source: string;
    lastUpdated: string;
  };
  error?: string;
}

class HolidaysService {
  private cache: Map<string, {data: Holiday[]; timestamp: number}> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 saat

  /**
   * Türkiye tatillerini getir (Cache ile)
   */
  async getTurkeyHolidays(year: number): Promise<Holiday[]> {
    const cacheKey = `turkey-${year}`;
    const cached = this.cache.get(cacheKey);

    // Cache kontrolü
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📦 Cache'den Türkiye tatilleri: ${year}`);
      return cached.data;
    }

    try {
      console.log(`🌐 API'den Türkiye tatilleri çekiliyor: ${year}`);

      const response = await api.get(`/holidays/turkey/${year}`);

      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response data:', response.data);

      if (!response.success) {
        throw new Error(response.error || 'Tatil verileri alınamadı');
      }

      const holidays = response.data.holidays;

      // Cache'e kaydet
      this.cache.set(cacheKey, {
        data: holidays,
        timestamp: Date.now(),
      });

      console.log(`✅ ${holidays.length} tatil alındı: ${year}`);
      return holidays;
    } catch (error) {
      console.error('❌ Holidays API error:', error);

      // Fallback: Temel tatiller
      const fallbackHolidays: Holiday[] = [
        {
          date: `${year}-01-01`,
          name: 'Yılbaşı',
          englishName: "New Year's Day",
          type: 'national',
          global: true,
          color: '#EF4444',
        },
        {
          date: `${year}-04-23`,
          name: 'Ulusal Egemenlik ve Çocuk Bayramı',
          englishName: "National Sovereignty and Children's Day",
          type: 'national',
          global: true,
          color: '#EF4444',
        },
        {
          date: `${year}-05-01`,
          name: 'Emek ve Dayanışma Günü',
          englishName: 'Labor and Solidarity Day',
          type: 'national',
          global: true,
          color: '#EF4444',
        },
        {
          date: `${year}-05-19`,
          name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı",
          englishName: 'Commemoration of Atatürk, Youth and Sports Day',
          type: 'national',
          global: true,
          color: '#EF4444',
        },
        {
          date: `${year}-08-30`,
          name: 'Zafer Bayramı',
          englishName: 'Victory Day',
          type: 'national',
          global: true,
          color: '#EF4444',
        },
        {
          date: `${year}-10-29`,
          name: 'Cumhuriyet Bayramı',
          englishName: 'Republic Day',
          type: 'national',
          global: true,
          color: '#EF4444',
        },
      ];

      console.warn('⚠️ Fallback tatiller kullanılıyor');
      return fallbackHolidays;
    }
  }

  /**
   * Güncel yılın tatillerini getir
   */
  async getCurrentYearHolidays(): Promise<Holiday[]> {
    const currentYear = new Date().getFullYear();
    return this.getTurkeyHolidays(currentYear);
  }

  /**
   * Belirli bir tarihteki tatili getir
   */
  async getHolidayByDate(date: string): Promise<Holiday | null> {
    const year = new Date(date).getFullYear();
    const holidays = await this.getTurkeyHolidays(year);

    return holidays.find(holiday => holiday.date === date) || null;
  }

  /**
   * Cache'i temizle
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Holidays cache temizlendi');
  }

  /**
   * Cache durumunu getir
   */
  getCacheStatus(): {size: number; keys: string[]} {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export default new HolidaysService();
