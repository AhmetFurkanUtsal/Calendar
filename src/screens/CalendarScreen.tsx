import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  SafeAreaView,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import {Calendar, LocaleConfig} from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Feather';
import {DesignSystem, Colors} from '../theme/designSystem';
import Modal from 'react-native-modal';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Responsive breakpoints
const isTablet = SCREEN_WIDTH >= 768;

// Tür tanımlamaları
interface HolidayEvent {
  name?: string;
  type: 'national' | 'religious';
  color: string;
  period?: {
    start: boolean;
    end: boolean;
  };
}

interface PeriodEvent {
  name?: string;
  type: 'vacation' | 'work';
  color: string;
  period: {
    start: boolean;
    end: boolean;
  };
}

interface Event {
  id: string;
  title: string;
  start: string;
  category: string;
  color: string;
  isHoliday?: boolean;
  isPeriod?: boolean;
}

// Türkçe yerelleştirme
LocaleConfig.locales['tr'] = {
  monthNames: [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ],
  monthNamesShort: [
    'Oca',
    'Şub',
    'Mar',
    'Nis',
    'May',
    'Haz',
    'Tem',
    'Ağu',
    'Eyl',
    'Eki',
    'Kas',
    'Ara',
  ],
  dayNames: [
    'Pazar',
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
    'Cumartesi',
  ],
  dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  today: 'Bugün',
};
LocaleConfig.defaultLocale = 'tr';

// Türkiye resmi tatilleri ve bayramları
const turkishHolidays: Record<string, HolidayEvent> = {
  // 2025 Resmi Tatiller
  '2025-01-01': {
    name: 'Yılbaşı',
    type: 'national',
    color: '#EF4444',
  },
  '2025-04-23': {
    name: 'Ulusal Egemenlik ve Çocuk Bayramı',
    type: 'national',
    color: '#EF4444',
  },
  '2025-05-01': {
    name: 'Emek ve Dayanışma Günü',
    type: 'national',
    color: '#EF4444',
  },
  '2025-05-19': {
    name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı",
    type: 'national',
    color: '#EF4444',
  },
  '2025-08-30': {
    name: 'Zafer Bayramı',
    type: 'national',
    color: '#EF4444',
  },
  '2025-10-29': {
    name: 'Cumhuriyet Bayramı',
    type: 'national',
    color: '#EF4444',
  },

  // 2025 Dini Bayramlar (Ramazan Bayramı - 3 gün)
  '2025-03-30': {
    name: 'Ramazan Bayramı 1. Gün',
    type: 'religious',
    color: Colors.lifestyle.dini,
    period: {start: true, end: false},
  },
  '2025-03-31': {
    name: 'Ramazan Bayramı 2. Gün',
    type: 'religious',
    color: DesignSystem.Colors.lifestyle.dini,
    period: {start: false, end: false},
  },
  '2025-04-01': {
    name: 'Ramazan Bayramı 3. Gün',
    type: 'religious',
    color: DesignSystem.Colors.lifestyle.dini,
    period: {start: false, end: true},
  },

  // Kurban Bayramı (4 gün)
  '2025-06-06': {
    name: 'Kurban Bayramı 1. Gün',
    type: 'religious',
    color: DesignSystem.Colors.lifestyle.dini,
    period: {start: true, end: false},
  },
  '2025-06-07': {
    name: 'Kurban Bayramı 2. Gün',
    type: 'religious',
    color: DesignSystem.Colors.lifestyle.dini,
    period: {start: false, end: false},
  },
  '2025-06-08': {
    name: 'Kurban Bayramı 3. Gün',
    type: 'religious',
    color: DesignSystem.Colors.lifestyle.dini,
    period: {start: false, end: false},
  },
  '2025-06-09': {
    name: 'Kurban Bayramı 4. Gün',
    type: 'religious',
    color: DesignSystem.Colors.lifestyle.dini,
    period: {start: false, end: true},
  },
};

// Çok günlük etkinlik örnekleri
const periodEvents: Record<string, PeriodEvent> = {
  // Yaz tatili dönemi
  '2025-06-15': {
    name: 'Yaz Tatili Başlangıç',
    type: 'vacation',
    color: '#10B981',
    period: {start: true, end: false},
  },
  '2025-06-16': {
    type: 'vacation',
    color: '#10B981',
    period: {start: false, end: false},
  },
  '2025-06-17': {
    type: 'vacation',
    color: '#10B981',
    period: {start: false, end: false},
  },
  '2025-06-18': {
    type: 'vacation',
    color: '#10B981',
    period: {start: false, end: false},
  },
  '2025-06-19': {
    type: 'vacation',
    color: '#10B981',
    period: {start: false, end: false},
  },
  '2025-06-20': {
    name: 'Yaz Tatili Son',
    type: 'vacation',
    color: '#10B981',
    period: {start: false, end: true},
  },

  // Proje teslim haftası
  '2025-07-01': {
    name: 'Proje Teslim Haftası',
    type: 'work',
    color: DesignSystem.Colors.lifestyle.kariyer,
    period: {start: true, end: false},
  },
  '2025-07-02': {
    type: 'work',
    color: DesignSystem.Colors.lifestyle.kariyer,
    period: {start: false, end: false},
  },
  '2025-07-03': {
    type: 'work',
    color: DesignSystem.Colors.lifestyle.kariyer,
    period: {start: false, end: false},
  },
  '2025-07-04': {
    type: 'work',
    color: DesignSystem.Colors.lifestyle.kariyer,
    period: {start: false, end: false},
  },
  '2025-07-05': {
    name: 'Proje Teslim',
    type: 'work',
    color: DesignSystem.Colors.lifestyle.kariyer,
    period: {start: false, end: true},
  },
};

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Sabah Namazı',
    start: '2025-06-30T05:30:00',
    category: 'dini',
    color: DesignSystem.Colors.lifestyle.dini,
  },
  {
    id: '2',
    title: 'Takım Toplantısı',
    start: '2025-06-30T10:00:00',
    category: 'kariyer',
    color: DesignSystem.Colors.lifestyle.kariyer,
  },
  {
    id: '3',
    title: 'Veteriner Randevusu',
    start: '2025-06-30T14:30:00',
    category: 'hayvanseverlik',
    color: DesignSystem.Colors.lifestyle.hayvanseverlik,
  },
];

export const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [eventModalVisible, setEventModalVisible] = useState(false);

  // Responsive sidebar width
  const sidebarWidth = isTablet ? 350 : Math.min(SCREEN_WIDTH * 0.8, 320);
  const sidebarAnim = useRef(new Animated.Value(-sidebarWidth)).current;

  // Google Calendar benzeri sidebar animation
  const toggleSidebar = () => {
    const toValue = sidebarVisible ? -sidebarWidth : 0;
    Animated.timing(sidebarAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setSidebarVisible(!sidebarVisible);
  };

  // Dönem ve nokta işaretlemelerini birleştir
  const getMarkedDates = () => {
    const marked: any = {};

    // Normal etkinlikler için nokta işaretlemesi
    const filteredEvents = mockEvents.filter(
      event => categoryFilter === 'all' || event.category === categoryFilter,
    );

    filteredEvents.forEach(event => {
      const dateString = event.start.split('T')[0];
      if (!marked[dateString]) {
        marked[dateString] = {dots: []};
      }

      marked[dateString].dots.push({
        color: event.color,
        key: event.id,
      });
    });

    // Türkiye tatilleri ve çok günlük etkinlikler için dönem işaretlemesi
    const allPeriodEvents = {...turkishHolidays, ...periodEvents};

    Object.entries(allPeriodEvents).forEach(([date, event]) => {
      if (!marked[date]) {
        marked[date] = {};
      }

      if (event.period) {
        // Period marking
        marked[date] = {
          ...marked[date],
          color: event.color,
          textColor: '#FFFFFF',
          startingDay: event.period.start,
          endingDay: event.period.end,
        };
      } else {
        // Single day holiday
        marked[date] = {
          ...marked[date],
          color: event.color,
          textColor: '#FFFFFF',
          startingDay: true,
          endingDay: true,
        };
      }
    });

    // Selected date highlight
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: DesignSystem.Colors.primary[500],
      };
    }

    return marked;
  };

  // Seçili tarihteki eventleri getir (normal etkinlikler + tatil bilgisi)
  const getEventsForDate = (date: string) => {
    const normalEvents = mockEvents.filter(
      event =>
        event.start.split('T')[0] === date &&
        (categoryFilter === 'all' || event.category === categoryFilter),
    );

    // Tatil ve dönem etkinliklerini kontrol et
    const holidayEvent = turkishHolidays[date];
    const periodEvent = periodEvents[date];

    const specialEvents = [];

    if (holidayEvent) {
      specialEvents.push({
        id: `holiday-${date}`,
        title:
          holidayEvent.name ||
          (holidayEvent.type === 'religious' ? 'Dini Bayram' : 'Resmi Tatil'),
        start: `${date}T00:00:00`,
        category: holidayEvent.type === 'religious' ? 'dini' : 'resmi',
        color: holidayEvent.color,
        isHoliday: true,
      });
    }

    if (periodEvent && periodEvent.name) {
      specialEvents.push({
        id: `period-${date}`,
        title: periodEvent.name,
        start: `${date}T00:00:00`,
        category: periodEvent.type,
        color: periodEvent.color,
        isPeriod: true,
      });
    }

    return [...normalEvents, ...specialEvents];
  };

  // Event'e tıklandığında
  const handleEventPress = (event: any) => {
    let description = `Kategori: ${event.category}\n`;

    if (event.isHoliday) {
      description += 'Resmi Tatil 🇹🇷';
    } else if (event.isPeriod) {
      description += 'Çok Günlük Etkinlik 📅';
    } else {
      description += `Saat: ${event.start.split('T')[1].slice(0, 5)}`;
    }

    Alert.alert(event.title, description);
  };

  // Responsive calendar height
  const calendarHeight = isTablet ? 400 : Math.min(SCREEN_HEIGHT * 0.45, 350);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={DesignSystem.Colors.neutral[50]}
      />

      <View style={styles.calendarContainer}>
        {/* Responsive Minimalist Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Icon
              name="menu"
              size={isTablet ? 28 : 24}
              color={DesignSystem.Colors.neutral[700]}
            />
          </TouchableOpacity>

          <Text
            style={[styles.headerTitle, isTablet && styles.headerTitleTablet]}>
            Takvim
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setEventModalVisible(true)}>
            <Icon
              name="plus"
              size={isTablet ? 28 : 24}
              color={DesignSystem.Colors.primary[500]}
            />
          </TouchableOpacity>
        </View>

        {/* Responsive Calendar Component with Period Marking */}
        <View style={styles.calendarWrapper}>
          <Calendar
            markingType="period"
            markedDates={getMarkedDates()}
            onDayPress={day => {
              setSelectedDate(day.dateString);
            }}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: DesignSystem.Colors.neutral[600],
              selectedDayBackgroundColor: DesignSystem.Colors.primary[500],
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: DesignSystem.Colors.primary[500],
              dayTextColor: DesignSystem.Colors.neutral[900],
              textDisabledColor: DesignSystem.Colors.neutral[400],
              arrowColor: DesignSystem.Colors.primary[500],
              monthTextColor: DesignSystem.Colors.neutral[900],
              textDayFontSize: isTablet ? 18 : 16,
              textMonthFontSize: isTablet ? 20 : 18,
              textDayHeaderFontSize: isTablet ? 16 : 14,
            }}
            style={[styles.calendar, {height: calendarHeight}]}
            firstDay={1} // Haftanın ilk günü Pazartesi
          />
        </View>

        {/* Legend - Dönem İşaretlemesi Açıklaması */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Açıklama:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, {backgroundColor: '#EF4444'}]}
              />
              <Text style={styles.legendText}>Resmi Tatil</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  {backgroundColor: DesignSystem.Colors.lifestyle.dini},
                ]}
              />
              <Text style={styles.legendText}>Dini Bayram</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, {backgroundColor: '#10B981'}]}
              />
              <Text style={styles.legendText}>Tatil Dönemi</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  {backgroundColor: DesignSystem.Colors.lifestyle.kariyer},
                ]}
              />
              <Text style={styles.legendText}>İş Projesi</Text>
            </View>
          </View>
        </View>

        {/* Responsive Events Section */}
        <View style={styles.eventsSection}>
          <Text
            style={[
              styles.eventsSectionTitle,
              isTablet && styles.eventsSectionTitleTablet,
            ]}>
            {selectedDate} - Etkinlikler
          </Text>
          <ScrollView
            style={styles.eventsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.eventsListContent}>
            {getEventsForDate(selectedDate).map(event => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventItem,
                  {borderLeftColor: event.color},
                  isTablet && styles.eventItemTablet,
                  event.isHoliday && styles.holidayEventItem,
                ]}
                onPress={() => handleEventPress(event)}>
                <View style={styles.eventContent}>
                  <Text
                    style={[
                      styles.eventTitle,
                      isTablet && styles.eventTitleTablet,
                      event.isHoliday && styles.holidayEventTitle,
                    ]}>
                    {event.isHoliday && '🇹🇷 '}
                    {event.isPeriod && '📅 '}
                    {event.title}
                  </Text>
                  {!event.isHoliday && !event.isPeriod && (
                    <Text
                      style={[
                        styles.eventTime,
                        isTablet && styles.eventTimeTablet,
                      ]}>
                      {event.start.split('T')[1].slice(0, 5)}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.eventCategory,
                    {backgroundColor: event.color},
                  ]}>
                  <Text style={styles.eventCategoryText}>{event.category}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {getEventsForDate(selectedDate).length === 0 && (
              <View style={styles.noEventsContainer}>
                <Icon
                  name="calendar"
                  size={isTablet ? 56 : 48}
                  color={DesignSystem.Colors.neutral[400]}
                />
                <Text
                  style={[
                    styles.noEventsText,
                    isTablet && styles.noEventsTextTablet,
                  ]}>
                  Bu tarihte etkinlik bulunmuyor
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Responsive Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            width: sidebarWidth,
            transform: [{translateX: sidebarAnim}],
          },
        ]}>
        <View style={styles.sidebarHeader}>
          <Text
            style={[
              styles.sidebarTitle,
              isTablet && styles.sidebarTitleTablet,
            ]}>
            LifeSync
          </Text>
          <TouchableOpacity onPress={toggleSidebar}>
            <Icon
              name="x"
              size={isTablet ? 28 : 24}
              color={DesignSystem.Colors.neutral[700]}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.sidebarContent}>
          {/* Category Filters */}
          <View style={styles.categorySection}>
            <Text
              style={[
                styles.categoryTitle,
                isTablet && styles.categoryTitleTablet,
              ]}>
              Kategoriler
            </Text>

            <TouchableOpacity
              style={[
                styles.categoryItem,
                categoryFilter === 'all' && styles.categoryItemActive,
                isTablet && styles.categoryItemTablet,
              ]}
              onPress={() => setCategoryFilter('all')}>
              <View
                style={[
                  styles.categoryDot,
                  {backgroundColor: DesignSystem.Colors.neutral[400]},
                ]}
              />
              <Text
                style={[
                  styles.categoryName,
                  isTablet && styles.categoryNameTablet,
                ]}>
                Tümü
              </Text>
            </TouchableOpacity>

            {Object.entries(DesignSystem.Colors.lifestyle).map(
              ([key, color]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryItem,
                    categoryFilter === key && styles.categoryItemActive,
                    isTablet && styles.categoryItemTablet,
                  ]}
                  onPress={() => setCategoryFilter(key)}>
                  <View
                    style={[styles.categoryDot, {backgroundColor: color}]}
                  />
                  <Text
                    style={[
                      styles.categoryName,
                      isTablet && styles.categoryNameTablet,
                    ]}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text
              style={[
                styles.categoryTitle,
                isTablet && styles.categoryTitleTablet,
              ]}>
              Hızlı İşlemler
            </Text>

            <TouchableOpacity
              style={[
                styles.quickActionItem,
                isTablet && styles.quickActionItemTablet,
              ]}>
              <Icon
                name="plus-circle"
                size={isTablet ? 24 : 20}
                color={DesignSystem.Colors.primary[500]}
              />
              <Text
                style={[
                  styles.quickActionText,
                  isTablet && styles.quickActionTextTablet,
                ]}>
                Etkinlik Ekle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionItem,
                isTablet && styles.quickActionItemTablet,
              ]}>
              <Icon
                name="calendar"
                size={isTablet ? 24 : 20}
                color={DesignSystem.Colors.primary[500]}
              />
              <Text
                style={[
                  styles.quickActionText,
                  isTablet && styles.quickActionTextTablet,
                ]}>
                Bugün
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionItem,
                isTablet && styles.quickActionItemTablet,
              ]}>
              <Icon
                name="clock"
                size={isTablet ? 24 : 20}
                color={DesignSystem.Colors.primary[500]}
              />
              <Text
                style={[
                  styles.quickActionText,
                  isTablet && styles.quickActionTextTablet,
                ]}>
                Yaklaşan
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Responsive Overlay */}
      {sidebarVisible && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={toggleSidebar}
          activeOpacity={1}
        />
      )}

      {/* Responsive Modal */}
      <Modal
        isVisible={eventModalVisible}
        onBackdropPress={() => setEventModalVisible(false)}
        style={styles.modal}
        deviceWidth={SCREEN_WIDTH}
        deviceHeight={SCREEN_HEIGHT}>
        <View
          style={[styles.modalContent, isTablet && styles.modalContentTablet]}>
          <Text
            style={[styles.modalTitle, isTablet && styles.modalTitleTablet]}>
            Yeni Etkinlik
          </Text>
          <Text
            style={[
              styles.modalSubtitle,
              isTablet && styles.modalSubtitleTablet,
            ]}>
            Bu özellik yakında eklenecek!
          </Text>
          <TouchableOpacity
            style={[styles.modalButton, isTablet && styles.modalButtonTablet]}
            onPress={() => setEventModalVisible(false)}>
            <Text
              style={[
                styles.modalButtonText,
                isTablet && styles.modalButtonTextTablet,
              ]}>
              Tamam
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.Colors.neutral[50],
  },
  calendarContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.Spacing.md,
    paddingVertical: DesignSystem.Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.Colors.neutral[200],
    ...DesignSystem.Shadows.sm,
    minHeight: 60,
  },
  menuButton: {
    padding: DesignSystem.Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...DesignSystem.Typography.h2,
    color: DesignSystem.Colors.neutral[900],
    fontWeight: '600',
  },
  headerTitleTablet: {
    ...DesignSystem.Typography.h1,
  },
  addButton: {
    padding: DesignSystem.Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.Colors.neutral[200],
    ...DesignSystem.Shadows.sm,
    marginHorizontal: DesignSystem.Spacing.md,
    marginTop: DesignSystem.Spacing.md,
    borderRadius: DesignSystem.BorderRadius.lg,
  },
  calendar: {
    borderBottomWidth: 0,
  },

  // Legend for Period Marking
  legendContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: DesignSystem.Spacing.md,
    marginTop: DesignSystem.Spacing.sm,
    padding: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.md,
    ...DesignSystem.Shadows.sm,
  },
  legendTitle: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.Colors.neutral[700],
    fontWeight: '600',
    marginBottom: DesignSystem.Spacing.xs,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: DesignSystem.Spacing.sm,
    marginBottom: DesignSystem.Spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: DesignSystem.Spacing.xs,
  },
  legendText: {
    ...DesignSystem.Typography.small,
    color: DesignSystem.Colors.neutral[600],
  },

  // Responsive Events Section
  eventsSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: DesignSystem.Spacing.md,
    marginTop: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.lg,
    ...DesignSystem.Shadows.sm,
  },
  eventsSectionTitle: {
    ...DesignSystem.Typography.h3,
    color: DesignSystem.Colors.neutral[800],
    paddingHorizontal: DesignSystem.Spacing.md,
    paddingVertical: DesignSystem.Spacing.sm,
    backgroundColor: DesignSystem.Colors.neutral[100],
    borderTopLeftRadius: DesignSystem.BorderRadius.lg,
    borderTopRightRadius: DesignSystem.BorderRadius.lg,
  },
  eventsSectionTitleTablet: {
    ...DesignSystem.Typography.h2,
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    paddingBottom: DesignSystem.Spacing.lg,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.Spacing.md,
    paddingVertical: DesignSystem.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.Colors.neutral[200],
    borderLeftWidth: 4,
    backgroundColor: '#FFFFFF',
    minHeight: 60,
  },
  eventItemTablet: {
    paddingVertical: DesignSystem.Spacing.lg,
    minHeight: 80,
  },
  holidayEventItem: {
    backgroundColor: '#FEF3F2',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.Colors.neutral[900],
    fontWeight: '500',
  },
  eventTitleTablet: {
    ...DesignSystem.Typography.h3,
  },
  holidayEventTitle: {
    fontWeight: '600',
    color: '#DC2626',
  },
  eventTime: {
    ...DesignSystem.Typography.caption,
    color: DesignSystem.Colors.neutral[600],
    marginTop: 2,
  },
  eventTimeTablet: {
    ...DesignSystem.Typography.body,
  },
  eventCategory: {
    paddingHorizontal: DesignSystem.Spacing.sm,
    paddingVertical: DesignSystem.Spacing.xs,
    borderRadius: DesignSystem.BorderRadius.sm,
  },
  eventCategoryText: {
    ...DesignSystem.Typography.small,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: DesignSystem.Spacing.xxl,
  },
  noEventsText: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.Colors.neutral[600],
    marginTop: DesignSystem.Spacing.sm,
    textAlign: 'center',
  },
  noEventsTextTablet: {
    ...DesignSystem.Typography.h3,
  },

  // Responsive Sidebar
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    ...DesignSystem.Shadows.md,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.Spacing.md,
    paddingVertical: DesignSystem.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.Colors.neutral[200],
    minHeight: 60,
  },
  sidebarTitle: {
    ...DesignSystem.Typography.h2,
    color: DesignSystem.Colors.primary[500],
    fontWeight: '700',
  },
  sidebarTitleTablet: {
    ...DesignSystem.Typography.h1,
  },
  sidebarContent: {
    flex: 1,
    paddingHorizontal: DesignSystem.Spacing.md,
  },
  categorySection: {
    paddingVertical: DesignSystem.Spacing.md,
  },
  categoryTitle: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.Colors.neutral[800],
    fontWeight: '600',
    marginBottom: DesignSystem.Spacing.sm,
  },
  categoryTitleTablet: {
    ...DesignSystem.Typography.h3,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.Spacing.sm,
    paddingHorizontal: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.md,
    marginBottom: DesignSystem.Spacing.xs,
    minHeight: 44,
  },
  categoryItemTablet: {
    paddingVertical: DesignSystem.Spacing.md,
    minHeight: 56,
  },
  categoryItemActive: {
    backgroundColor: DesignSystem.Colors.primary[50],
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: DesignSystem.Spacing.sm,
  },
  categoryName: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.Colors.neutral[700],
  },
  categoryNameTablet: {
    ...DesignSystem.Typography.h3,
  },
  quickActionsSection: {
    paddingVertical: DesignSystem.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.Colors.neutral[200],
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.Spacing.sm,
    paddingHorizontal: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.md,
    marginBottom: DesignSystem.Spacing.xs,
    minHeight: 44,
  },
  quickActionItemTablet: {
    paddingVertical: DesignSystem.Spacing.md,
    minHeight: 56,
  },
  quickActionText: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.Colors.neutral[700],
    marginLeft: DesignSystem.Spacing.sm,
  },
  quickActionTextTablet: {
    ...DesignSystem.Typography.h3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },

  // Responsive Modal
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: DesignSystem.Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: DesignSystem.BorderRadius.lg,
    paddingHorizontal: DesignSystem.Spacing.xl,
    paddingVertical: DesignSystem.Spacing.lg,
    alignItems: 'center',
    minWidth: Math.min(SCREEN_WIDTH * 0.8, 320),
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  modalContentTablet: {
    minWidth: 400,
    paddingHorizontal: DesignSystem.Spacing.xxl,
    paddingVertical: DesignSystem.Spacing.xl,
  },
  modalTitle: {
    ...DesignSystem.Typography.h2,
    color: DesignSystem.Colors.neutral[900],
    marginBottom: DesignSystem.Spacing.sm,
    textAlign: 'center',
  },
  modalTitleTablet: {
    ...DesignSystem.Typography.h1,
  },
  modalSubtitle: {
    ...DesignSystem.Typography.body,
    color: DesignSystem.Colors.neutral[600],
    textAlign: 'center',
    marginBottom: DesignSystem.Spacing.lg,
  },
  modalSubtitleTablet: {
    ...DesignSystem.Typography.h3,
  },
  modalButton: {
    backgroundColor: DesignSystem.Colors.primary[500],
    paddingHorizontal: DesignSystem.Spacing.xl,
    paddingVertical: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.md,
    minWidth: 120,
  },
  modalButtonTablet: {
    paddingHorizontal: DesignSystem.Spacing.xxl,
    paddingVertical: DesignSystem.Spacing.md,
    minWidth: 160,
  },
  modalButtonText: {
    ...DesignSystem.Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonTextTablet: {
    ...DesignSystem.Typography.h3,
  },
});
