import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Feather';
import {DesignSystem} from '../theme/designSystem';
import holidaysService, {Holiday} from '../services/holidaysService';

// Örnek event'ler
const mockEvents = [
  {
    id: '1',
    title: 'Sabah Namazı',
    time: '05:30',
    category: 'dini',
    color: DesignSystem.colors.lifestyle.dini || '#8B5CF6',
  },
  {
    id: '2',
    title: 'Takım Toplantısı',
    time: '10:00',
    category: 'kariyer',
    color: DesignSystem.colors.lifestyle.kariyer || '#3B82F6',
  },
  {
    id: '3',
    title: 'Veteriner Randevusu',
    time: '14:30',
    category: 'hayvanseverlik',
    color: DesignSystem.colors.lifestyle.hayvanseverlik || '#F59E0B',
  },
];

export const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);

  // API'den Türkiye tatillerini çek
  useEffect(() => {
    const loadHolidays = async () => {
      setHolidaysLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const turkeyHolidays = await holidaysService.getTurkeyHolidays(
          currentYear,
        );
        setHolidays(turkeyHolidays);
        console.log('🏛️ Türkiye tatilleri yüklendi:', turkeyHolidays.length);
      } catch (error) {
        console.error('❌ Tatiller yüklenemedi:', error);
        Alert.alert('Hata', 'Tatil bilgileri yüklenemedi');
      } finally {
        setHolidaysLoading(false);
      }
    };

    loadHolidays();
  }, []);

  // Calendar marked dates
  const getMarkedDates = () => {
    const marked: any = {};

    // Mock event'leri işaretle
    mockEvents.forEach(event => {
      const dateString = selectedDate;
      if (!marked[dateString]) {
        marked[dateString] = {dots: []};
      }

      marked[dateString].dots.push({
        color: event.color,
        key: event.id,
      });
    });

    // API'den gelen Türkiye tatillerini işaretle
    holidays.forEach(holiday => {
      if (!marked[holiday.date]) {
        marked[holiday.date] = {dots: []};
      }

      marked[holiday.date].dots.push({
        color: holiday.color,
        key: `holiday-${holiday.date}`,
      });
    });

    // Selected date highlight
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: DesignSystem.colors.primary[500],
      };
    }

    return marked;
  };

  // Seçili tarihteki tüm etkinlikleri getir (mockEvents + holidays)
  const getEventsForDate = (date: string) => {
    const events: any[] = [...mockEvents];

    // Bu tarihteki tatilleri ekle
    const dayHolidays = holidays.filter(holiday => holiday.date === date);
    dayHolidays.forEach(holiday => {
      events.push({
        id: `holiday-${holiday.date}`,
        title: `🇹🇷 ${holiday.name}`,
        time: 'Tüm Gün',
        category: holiday.type === 'national' ? 'resmi-tatil' : 'dini-bayram',
        color: holiday.color,
        isHoliday: true,
      });
    });

    return events;
  };

  // Event render item
  const renderEventItem = ({item}: {item: any}) => (
    <TouchableOpacity style={styles.eventItem}>
      <View style={[styles.eventDot, {backgroundColor: item.color}]} />
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventTime}>{item.time}</Text>
      </View>
      <Text style={styles.eventCategory}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Icon
            name="menu"
            size={24}
            color={DesignSystem.colors.neutral[700]}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Takvim</Text>

        <TouchableOpacity style={styles.addButton}>
          <Icon
            name="plus"
            size={24}
            color={DesignSystem.colors.primary[500]}
          />
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <Calendar
        markingType="multi-dot"
        markedDates={getMarkedDates()}
        onDayPress={day => {
          setSelectedDate(day.dateString);
        }}
        theme={{
          backgroundColor: '#FFFFFF',
          calendarBackground: '#FFFFFF',
          textSectionTitleColor: DesignSystem.colors.neutral[600],
          selectedDayBackgroundColor: DesignSystem.colors.primary[500],
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: DesignSystem.colors.primary[500],
          dayTextColor: DesignSystem.colors.neutral[900],
          textDisabledColor: DesignSystem.colors.neutral[400],
          arrowColor: DesignSystem.colors.primary[500],
          monthTextColor: DesignSystem.colors.neutral[900],
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
        style={styles.calendar}
      />

      {/* Events List */}
      <View style={styles.eventsContainer}>
        <Text style={styles.eventsTitle}>
          {selectedDate} - Etkinlikler
          {holidaysLoading && ' (Tatiller yükleniyor...)'}
        </Text>

        <FlatList
          data={getEventsForDate(selectedDate)}
          keyExtractor={item => item.id}
          renderItem={renderEventItem}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral[200],
  },
  menuButton: {
    padding: DesignSystem.spacing.xs,
  },
  headerTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.neutral[900],
  },
  addButton: {
    padding: DesignSystem.spacing.xs,
  },
  calendar: {
    marginTop: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral[200],
  },
  eventsContainer: {
    flex: 1,
    padding: DesignSystem.spacing.md,
  },
  eventsTitle: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.neutral[900],
    marginBottom: DesignSystem.spacing.md,
  },
  eventsList: {
    paddingBottom: DesignSystem.spacing.xl,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.sm,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: DesignSystem.spacing.sm,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[900],
    fontWeight: '600',
  },
  eventTime: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
    marginTop: DesignSystem.spacing.xs,
  },
  eventCategory: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
    textTransform: 'capitalize',
  },
  fab: {
    position: 'absolute',
    bottom: DesignSystem.spacing.lg,
    right: DesignSystem.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DesignSystem.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...DesignSystem.shadows.md,
  },
});
