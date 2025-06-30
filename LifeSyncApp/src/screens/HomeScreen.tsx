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
} from 'lucide-react-native';
import {DesignSystem} from '../theme/designSystem';
import apiService from '../services/api';

// --- Types ---
interface Task {
  id: string;
  title: string;
  category: string;
  isCompleted: boolean;
}

interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
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

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Toplantı',
    startTime: '10:00',
    endTime: '11:00',
    category: 'kariyer',
  },
  {
    id: '2',
    title: 'Spor',
    startTime: '18:00',
    endTime: '19:00',
    category: 'saglik',
  },
];

// --- Sub-components ---
const Header: React.FC = () => (
  <View style={styles.header}>
    <View>
      <Text style={styles.headerGreeting}>Merhaba,</Text>
      <Text style={styles.headerUser}>Kullanıcı</Text>
    </View>
    <TouchableOpacity style={styles.profileIconContainer}>
      <User size={24} color={DesignSystem.Colors.primary[500]} />
    </TouchableOpacity>
  </View>
);

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
      <ActivityIndicator color={DesignSystem.Colors.primary[500]} />
    ) : weather ? (
      <>
        <View style={styles.weatherHeader}>
          <Text style={styles.weatherLocation}>{city}</Text>
          <TouchableOpacity>
            <MapPin size={16} color={DesignSystem.Colors.neutral[400]} />
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
            <Droplets size={14} color={DesignSystem.Colors.neutral[600]} />
            <Text style={styles.detailText}>{weather.humidity}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Sun size={16} color={DesignSystem.Colors.neutral[600]} />
            <Text style={styles.detailText}>UV {weather.uv}</Text>
          </View>
          <View style={styles.detailItem}>
            <Wind size={14} color={DesignSystem.Colors.neutral[600]} />
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
                DesignSystem.Colors.lifestyle[
                  task.category as keyof typeof DesignSystem.Colors.lifestyle
                ] || '#CCC',
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
            <Check size={20} color={DesignSystem.Colors.primary[500]} />
          ) : (
            <Plus size={20} color={DesignSystem.Colors.primary[500]} />
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

interface EventsCardProps {
  events: Event[];
}

const EventsCard: React.FC<EventsCardProps> = ({events}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>Bugünün Etkinlikleri</Text>
      <TouchableOpacity>
        <Text style={styles.seeAll}>Tümünü Gör</Text>
      </TouchableOpacity>
    </View>
    {events.map(event => (
      <View key={event.id} style={styles.eventItem}>
        <View
          style={[
            styles.eventTimeContainer,
            {
              borderColor:
                DesignSystem.Colors.lifestyle[
                  event.category as keyof typeof DesignSystem.Colors.lifestyle
                ],
            },
          ]}>
          <Text
            style={[
              styles.eventTime,
              {
                color:
                  DesignSystem.Colors.lifestyle[
                    event.category as keyof typeof DesignSystem.Colors.lifestyle
                  ],
              },
            ]}>
            {event.startTime}
          </Text>
        </View>
        <View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDuration}>
            {event.startTime} - {event.endTime}
          </Text>
        </View>
        <TouchableOpacity style={styles.eventDetailsButton}>
          <Text
            style={[
              styles.eventDetailsText,
              {
                color:
                  DesignSystem.Colors.lifestyle[
                    event.category as keyof typeof DesignSystem.Colors.lifestyle
                  ],
              },
            ]}>
            ?
          </Text>
        </TouchableOpacity>
      </View>
    ))}
  </View>
);

// --- Main Component ---
export const HomeScreen: React.FC = () => {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherCity] = useState<string>('Afyonkarahisar, Sandıklı');

  useEffect(() => {
    const fetchWeather = async () => {
      try {
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
        } else {
          console.error('Invalid weather data format:', response);
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Header />
        <WeatherCard
          weather={weather}
          loading={weatherLoading}
          city={weatherCity}
        />
        <StatsCard />
        <TasksCard tasks={mockTasks} />
        <EventsCard events={mockEvents} />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: DesignSystem.Colors.neutral[50]},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DesignSystem.Spacing.lg,
  },
  headerGreeting: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.Colors.neutral[600],
  },
  headerUser: {
    ...DesignSystem.Typography.h1,
    color: DesignSystem.Colors.neutral[900],
    fontWeight: 'bold',
  },
  profileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignSystem.Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: DesignSystem.Spacing.lg,
    padding: DesignSystem.Spacing.md,
    borderRadius: DesignSystem.BorderRadius.lg,
    ...DesignSystem.Shadows.sm,
    flexDirection: 'column',
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.Spacing.md,
  },
  weatherLocation: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.Colors.neutral[600],
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherTemp: {
    ...DesignSystem.Typography.h2,
    color: DesignSystem.Colors.neutral[800],
    marginHorizontal: DesignSystem.Spacing.md,
  },
  temperatureContainer: {
    alignItems: 'center',
    marginHorizontal: DesignSystem.Spacing.md,
  },
  tempRange: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.Colors.neutral[600],
    marginTop: DesignSystem.Spacing.xs,
  },
  weatherDescContainer: {
    flex: 1,
  },
  weatherDesc: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.Colors.neutral[600],
  },
  weatherIcon: {
    width: 50,
    height: 50,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DesignSystem.Spacing.md,
    paddingTop: DesignSystem.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.Colors.neutral[100],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.Colors.neutral[600],
    marginLeft: DesignSystem.Spacing.xs,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: DesignSystem.Spacing.lg,
    marginTop: DesignSystem.Spacing.md,
    padding: DesignSystem.Spacing.md,
    borderRadius: DesignSystem.BorderRadius.lg,
    ...DesignSystem.Shadows.sm,
  },
  statItem: {alignItems: 'center'},
  statValue: {
    ...DesignSystem.Typography.h3,
    color: DesignSystem.Colors.neutral[800],
    fontWeight: '600',
  },
  statLabel: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.Colors.neutral[600],
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: DesignSystem.Spacing.lg,
    padding: DesignSystem.Spacing.md,
    borderRadius: DesignSystem.BorderRadius.lg,
    ...DesignSystem.Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.Spacing.md,
  },
  cardTitle: {
    ...DesignSystem.Typography.h2,
    color: DesignSystem.Colors.neutral[900],
    fontWeight: 'bold',
  },
  seeAll: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.Colors.primary[500],
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.Colors.neutral[100],
  },
  taskCategoryIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: DesignSystem.Spacing.md,
  },
  taskTitle: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.Colors.neutral[800],
    fontWeight: '500',
  },
  taskCategory: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.Colors.neutral[600],
  },
  taskButton: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DesignSystem.Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskButtonCompleted: {backgroundColor: DesignSystem.Colors.primary[100]},
  addTaskButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignSystem.Colors.primary[500],
    padding: DesignSystem.Spacing.md,
    borderRadius: DesignSystem.BorderRadius.md,
    marginTop: DesignSystem.Spacing.md,
  },
  addTaskButtonText: {
    ...DesignSystem.Typography.body,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: DesignSystem.Spacing.sm,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.Colors.neutral[100],
  },
  eventTimeContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignSystem.Spacing.md,
  },
  eventTime: {...DesignSystem.Typography.h3, fontWeight: 'bold'},
  eventTitle: {...DesignSystem.Typography.body, fontWeight: 'bold'},
  eventDuration: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.Colors.neutral[600],
  },
  eventDetailsButton: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDetailsText: {...DesignSystem.Typography.h2, fontWeight: 'bold'},
});
