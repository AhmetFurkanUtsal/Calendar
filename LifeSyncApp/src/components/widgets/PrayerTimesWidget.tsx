import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {DesignSystem} from '../../theme/designSystem';
import ApiService from '../../services/api';
import {useAuthStore} from '../../stores/authStore';

interface PrayerTimes {
  location: string;
  date: string;
  times: {
    imsak: string;
    gunes: string;
    ogle: string;
    ikindi: string;
    aksam: string;
    yatsi: string;
  };
  hijriDate: string;
  nextPrayer: {
    name: string;
    time: string;
    timeLeft: string;
  };
}

const PRAYER_NAMES = {
  imsak: 'İmsak',
  gunes: 'Güneş',
  ogle: 'Öğle',
  ikindi: 'İkindi',
  aksam: 'Akşam',
  yatsi: 'Yatsı',
};

export const PrayerTimesWidget: React.FC = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedPrayers, setCompletedPrayers] = useState<Set<string>>(
    new Set(),
  );
  const {user} = useAuthStore();

  useEffect(() => {
    fetchPrayerTimes();
  }, []);

  const fetchPrayerTimes = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getPrayerTimes();
      setPrayerTimes(response.data);
    } catch (error) {
      console.error('Prayer times fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrayerComplete = async (
    prayerKey: string,
    prayerTime: string,
  ) => {
    try {
      const prayerName = PRAYER_NAMES[prayerKey as keyof typeof PRAYER_NAMES];
      await ApiService.markPrayerCompleted(prayerName, prayerTime);

      // Add to completed prayers
      setCompletedPrayers(prev => new Set([...prev, prayerKey]));

      // Success feedback
      Alert.alert('✅ Başarılı', `${prayerName} namazı kaydedildi`);
    } catch (error) {
      Alert.alert('❌ Hata', 'Namaz kaydedilemedi');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={DesignSystem.colors.lifestyle.dini} />
        <Text style={styles.loadingText}>Namaz vakitleri yükleniyor...</Text>
      </View>
    );
  }

  if (!prayerTimes) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon
          name="clock"
          size={20}
          color={DesignSystem.colors.lifestyle.dini}
        />
        <Text style={styles.title}>🕌 Namaz Vakitleri</Text>
        <TouchableOpacity onPress={fetchPrayerTimes}>
          <Icon
            name="refresh-cw"
            size={16}
            color={DesignSystem.colors.neutral[400]}
          />
        </TouchableOpacity>
      </View>

      {/* Location & Date */}
      <View style={styles.locationContainer}>
        <Text style={styles.location}>{prayerTimes.location}</Text>
        <Text style={styles.hijriDate}>{prayerTimes.hijriDate}</Text>
      </View>

      {/* Next Prayer Highlight */}
      {prayerTimes.nextPrayer && (
        <View style={styles.nextPrayerContainer}>
          <Text style={styles.nextPrayerLabel}>Sonraki Namaz:</Text>
          <Text style={styles.nextPrayerName}>
            {prayerTimes.nextPrayer.name}
          </Text>
          <Text style={styles.nextPrayerTime}>
            {prayerTimes.nextPrayer.time} • {prayerTimes.nextPrayer.timeLeft}{' '}
            kaldı
          </Text>
        </View>
      )}

      {/* Prayer Times List */}
      <View style={styles.prayersList}>
        {Object.entries(prayerTimes.times).map(([prayerKey, time]) => {
          const isCompleted = completedPrayers.has(prayerKey);
          const isNext =
            prayerTimes.nextPrayer?.name ===
            PRAYER_NAMES[prayerKey as keyof typeof PRAYER_NAMES];

          return (
            <View
              key={prayerKey}
              style={[
                styles.prayerItem,
                isNext && styles.nextPrayerItem,
                isCompleted && styles.completedPrayerItem,
              ]}>
              <Text
                style={[
                  styles.prayerName,
                  isNext && styles.nextPrayerText,
                  isCompleted && styles.completedText,
                ]}>
                {PRAYER_NAMES[prayerKey as keyof typeof PRAYER_NAMES]}
              </Text>

              <Text
                style={[
                  styles.prayerTime,
                  isNext && styles.nextPrayerText,
                  isCompleted && styles.completedText,
                ]}>
                {time}
              </Text>

              <TouchableOpacity
                style={[
                  styles.checkButton,
                  isCompleted && styles.checkButtonCompleted,
                ]}
                onPress={() => handlePrayerComplete(prayerKey, time)}
                disabled={isCompleted}>
                <Icon
                  name={isCompleted ? 'check' : 'circle'}
                  size={16}
                  color={
                    isCompleted ? '#FFFFFF' : DesignSystem.colors.lifestyle.dini
                  }
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Bu gün {completedPrayers.size}/6 namaz kılındı 🤲
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    margin: DesignSystem.spacing.md,
    ...DesignSystem.shadows.md,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.xl,
    margin: DesignSystem.spacing.md,
    alignItems: 'center',
    ...DesignSystem.shadows.sm,
  },
  loadingText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
    marginTop: DesignSystem.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.lifestyle.dini,
    flex: 1,
    marginLeft: DesignSystem.spacing.sm,
  },
  locationContainer: {
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  location: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[800],
    fontWeight: '600',
  },
  hijriDate: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
  },
  nextPrayerContainer: {
    backgroundColor: DesignSystem.colors.lifestyle.dini + '20',
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  nextPrayerLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
  },
  nextPrayerName: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.lifestyle.dini,
    fontWeight: '700',
  },
  nextPrayerTime: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.lifestyle.dini,
    fontWeight: '500',
  },
  prayersList: {
    marginBottom: DesignSystem.spacing.md,
  },
  prayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral[200],
  },
  nextPrayerItem: {
    backgroundColor: DesignSystem.colors.lifestyle.dini + '10',
    borderRadius: DesignSystem.borderRadius.md,
    borderBottomWidth: 0,
    marginBottom: DesignSystem.spacing.xs,
  },
  completedPrayerItem: {
    backgroundColor: DesignSystem.colors.neutral[100],
    borderRadius: DesignSystem.borderRadius.md,
    borderBottomWidth: 0,
    marginBottom: DesignSystem.spacing.xs,
  },
  prayerName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[800],
    flex: 1,
    fontWeight: '500',
  },
  prayerTime: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[600],
    marginRight: DesignSystem.spacing.md,
    fontWeight: '500',
  },
  nextPrayerText: {
    color: DesignSystem.colors.lifestyle.dini,
    fontWeight: '600',
  },
  completedText: {
    color: DesignSystem.colors.neutral[500],
    textDecorationLine: 'line-through',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: DesignSystem.colors.lifestyle.dini,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: DesignSystem.colors.lifestyle.dini,
    borderColor: DesignSystem.colors.lifestyle.dini,
  },
  footer: {
    alignItems: 'center',
    paddingTop: DesignSystem.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.neutral[200],
  },
  footerText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
    fontStyle: 'italic',
  },
});
