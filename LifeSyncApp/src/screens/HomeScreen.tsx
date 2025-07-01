import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  User,
  MapPin,
  Plus,
  Check,
  Sun,
  Droplets,
  Wind,
  LogOut,
} from 'lucide-react-native';
import {DesignSystem} from '../theme/designSystem';
import {useAuthStore} from '../stores/authStore';
import {PrayerTimesWidget} from '../components/widgets/PrayerTimesWidget';
import apiService from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types ---
interface Task {
  id: string;
  title: string;
  category: string;
  isCompleted: boolean;
}

interface AirQuality {
  co: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  'us-epa-index': number;
  'gb-defra-index': number;
}

interface Weather {
  temp: number;
  description: string;
  iconUrl: string;
  humidity: number;
  uv: number;
  air_quality: AirQuality | null;
  isDay: number;
  minTemp: number;
  maxTemp: number;
}

// --- Mock Data ---
const mockTasks: Task[] = [
  {id: '1', title: 'Sabah namazı', category: 'dini', isCompleted: false},
  {
    id: '2',
    title: 'Sokak hayvanlarını besle',
    category: 'hayvanseverlik',
    isCompleted: false,
  },
  {id: '3', title: 'Geri dönüşüm', category: 'cevre', isCompleted: true},
];

// --- Sub-components ---
const Header: React.FC = () => {
  const {logout, user} = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerGreeting}>Merhaba,</Text>
        <Text style={styles.headerUser}>
          {user?.displayName || 'Kullanıcı'}
        </Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.profileIconContainer}>
          <User size={24} color={DesignSystem.colors.primary[500]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={DesignSystem.colors.neutral[600]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getAirQualityText = (index?: number) => {
  if (!index) {
    return 'N/A';
  }
  switch (index) {
    case 1:
      return 'İyi';
    case 2:
      return 'Orta';
    case 3:
      return 'Hassas';
    case 4:
      return 'Sağlıksız';
    case 5:
      return 'Çok Sağlıksız';
    case 6:
      return 'Tehlikeli';
    default:
      return 'Bilinmiyor';
  }
};

interface WeatherCardProps {
  weather: Weather | null;
  loading: boolean;
  city?: string;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  weather,
  loading,
  city = 'Afyonkarahisar, Sandıklı',
}) => (
  <View style={styles.weatherCard}>
    {loading ? (
      <ActivityIndicator color={DesignSystem.colors.primary[500]} />
    ) : weather ? (
      <>
        <View style={styles.weatherHeader}>
          <Text style={styles.weatherLocation}>{city}</Text>
          <TouchableOpacity>
            <MapPin size={16} color={DesignSystem.colors.neutral[400]} />
          </TouchableOpacity>
        </View>
        <View style={styles.weatherContent}>
          <Image
            source={{uri: `https:${weather.iconUrl}`}}
            style={styles.weatherIcon}
            resizeMode="contain"
          />
          <View style={styles.temperatureContainer}>
            <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
            <Text style={styles.tempRange}>
              {Math.round(weather.minTemp)}° / {Math.round(weather.maxTemp)}°
            </Text>
          </View>
          <View style={styles.weatherDescContainer}>
            <Text style={styles.weatherDesc}>{weather.description}</Text>
          </View>
        </View>
        <View style={styles.weatherDetails}>
          <View style={styles.detailItem}>
            <Droplets size={14} color={DesignSystem.colors.neutral[600]} />
            <Text style={styles.detailText}>{weather.humidity}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Sun size={16} color={DesignSystem.colors.neutral[600]} />
            <Text style={styles.detailText}>UV {weather.uv}</Text>
          </View>
          <View style={styles.detailItem}>
            <Wind size={14} color={DesignSystem.colors.neutral[600]} />
            <Text style={styles.detailText}>
              {getAirQualityText(weather.air_quality?.['us-epa-index'])}
            </Text>
          </View>
        </View>
      </>
    ) : (
      <Text style={styles.weatherDesc}>Hava durumu verisi alınamadı.</Text>
    )}
  </View>
);

const StatsCard: React.FC = () => (
  <View style={styles.statsCard}>
    <View style={styles.statItem}>
      <Text style={styles.statValue}>🔥 5</Text>
      <Text style={styles.statLabel}>Günlük Seri</Text>
    </View>
    <View style={styles.statItem}>
      <Text style={styles.statValue}>✅ 120</Text>
      <Text style={styles.statLabel}>Tamamlanan</Text>
    </View>
    <View style={styles.statItem}>
      <Text style={styles.statValue}>📈 %68</Text>
      <Text style={styles.statLabel}>Başarı Oranı</Text>
    </View>
  </View>
);

interface TasksCardProps {
  tasks: Task[];
}

const TasksCard: React.FC<TasksCardProps> = ({tasks}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>Bugünün Görevleri</Text>
      <TouchableOpacity>
        <Text style={styles.seeAll}>Tümünü Gör</Text>
      </TouchableOpacity>
    </View>
    {tasks.map(task => (
      <View key={task.id} style={styles.taskItem}>
        <View
          style={[
            styles.taskCategoryIndicator,
            {
              backgroundColor:
                DesignSystem.colors.lifestyle[
                  task.category as keyof typeof DesignSystem.colors.lifestyle
                ] || DesignSystem.colors.neutral[400],
            },
          ]}
        />
        <View>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskCategory}>
            {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.taskButton,
            task.isCompleted && styles.taskButtonCompleted,
          ]}>
          {task.isCompleted ? (
            <Check size={20} color={DesignSystem.colors.primary[500]} />
          ) : (
            <Plus size={20} color={DesignSystem.colors.primary[500]} />
          )}
        </TouchableOpacity>
      </View>
    ))}
    <TouchableOpacity style={styles.addTaskButton}>
      <Plus size={20} color="#FFFFFF" />
      <Text style={styles.addTaskButtonText}>Yeni Görev Ekle</Text>
    </TouchableOpacity>
  </View>
);

// --- Main Component ---
export const HomeScreen: React.FC = () => {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherCity] = useState<string>('Afyonkarahisar, Sandıklı');
  const {user} = useAuthStore();

  // Kullanıcının dini kategoriyi seçip seçmediğini kontrol et
  const hasReligiousCategory =
    user?.lifestyle?.categories?.includes('dini') || false;

  useEffect(() => {
    const thirtyMinutes = 30 * 60 * 1000; // 30 dakika

    const fetchWeatherWithCache = async () => {
      try {
        // Cache kontrolü - Son güncellemeden 30 dakika geçmiş mi?
        const lastFetch = await AsyncStorage.getItem('@weather_last_fetch');
        const cachedWeather = await AsyncStorage.getItem('@weather_cache');

        const now = new Date().getTime();

        // Cache varsa ve 30 dakikadan eski değilse cache'den kullan
        if (
          lastFetch &&
          cachedWeather &&
          now - parseInt(lastFetch) < thirtyMinutes
        ) {
          console.log('🔄 Using cached weather data');
          setWeather(JSON.parse(cachedWeather));
          setWeatherLoading(false);
          return;
        }

        console.log('🌐 Fetching fresh weather data');
        await fetchWeather();
      } catch (error) {
        console.error('Weather cache error:', error);
        await fetchWeather(); // Fallback to direct fetch
      }
    };

    fetchWeatherWithCache();

    // Her 30 dakikada bir otomatik güncelleme
    const weatherInterval = setInterval(fetchWeatherWithCache, thirtyMinutes);

    return () => clearInterval(weatherInterval);
  }, []);

  const fetchWeather = async () => {
    try {
      setWeatherLoading(true);
      // API'ye şehir adı olarak "Afyonkarahisar" gönderiyoruz, fakat arayüzde Sandıklı olarak göstereceğiz
      const response = await apiService.getWeather('Afyonkarahisar');

      // API'nin döndüğü yapı: {success: true, data: {location: {...}, current: {...}}}
      if (response && response.success && response.data) {
        const {location, current} = response.data;

        // Debug için API verisini console'a yazdır
        console.log('🌤️ Weather API Response:', {
          location: location.name,
          temp_c: current.temp_c,
          condition: current.condition,
          'condition.code': current.condition.code,
          'condition.text': current.condition.text,
        });

        // Debug: Forecast verisinin varlığını kontrol et
        console.log('📊 Forecast Data Debug:', {
          'response.data': Object.keys(response.data),
          forecast_exists: !!response.data.forecast,
          forecast_content: response.data.forecast,
        });

        console.log(
          '🎯 Icon mapping için condition code:',
          current.condition.code,
        );

        const weatherData: Weather = {
          temp: Math.round(current.temp_c),
          description: current.condition.text,
          iconUrl: current.condition.icon,
          humidity: current.humidity,
          uv: current.uv,
          air_quality: current.air_quality,
          isDay: current.is_day,
          minTemp: response.data.forecast?.mintemp_c || current.temp_c - 5,
          maxTemp: response.data.forecast?.maxtemp_c || current.temp_c + 5,
        };

        setWeather(weatherData);

        // Cache'e kaydet
        await AsyncStorage.setItem(
          '@weather_cache',
          JSON.stringify(weatherData),
        );
        await AsyncStorage.setItem(
          '@weather_last_fetch',
          new Date().getTime().toString(),
        );

        console.log('💾 Weather data cached successfully');
      } else {
        console.error('Invalid weather data format:', response);
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Header />
        <WeatherCard
          weather={weather}
          loading={weatherLoading}
          city={weatherCity}
        />
        {/* Namaz Vakitleri Widget - Sadece dini kategori seçen kullanıcılar için */}
        {hasReligiousCategory && <PrayerTimesWidget />}
        <StatsCard />
        <TasksCard tasks={mockTasks} />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: DesignSystem.colors.neutral[50]},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  headerGreeting: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[600],
  },
  headerUser: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.neutral[900],
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
  },
  profileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignSystem.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.lg,
    ...DesignSystem.shadows.sm,
    flexDirection: 'column',
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  weatherLocation: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[600],
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherTemp: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.neutral[800],
    marginHorizontal: DesignSystem.spacing.md,
  },
  temperatureContainer: {
    alignItems: 'center',
    marginHorizontal: DesignSystem.spacing.md,
  },
  tempRange: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
    marginTop: DesignSystem.spacing.xs,
  },
  weatherDescContainer: {
    flex: 1,
  },
  weatherDesc: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[600],
  },
  weatherIcon: {
    width: 50,
    height: 50,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DesignSystem.spacing.md,
    paddingTop: DesignSystem.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.neutral[100],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
    marginLeft: DesignSystem.spacing.xs,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: DesignSystem.spacing.lg,
    marginTop: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.lg,
    ...DesignSystem.shadows.sm,
  },
  statItem: {alignItems: 'center'},
  statValue: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.neutral[800],
    fontWeight: '600',
  },
  statLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: DesignSystem.spacing.lg,
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.lg,
    ...DesignSystem.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  cardTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.neutral[900],
    fontWeight: 'bold',
  },
  seeAll: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.primary[500],
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral[100],
  },
  taskCategoryIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: DesignSystem.spacing.md,
  },
  taskTitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[800],
    fontWeight: '500',
  },
  taskCategory: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
  },
  taskButton: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskButtonCompleted: {backgroundColor: DesignSystem.colors.primary[100]},
  addTaskButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.primary[500],
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    marginTop: DesignSystem.spacing.md,
  },
  addTaskButtonText: {
    ...DesignSystem.typography.body,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: DesignSystem.spacing.sm,
  },
});
