import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {DesignSystem, Colors} from '../../theme/designSystem';

interface Event {
  id: string;
  title: string;
  start: string;
  category: string;
  color: string;
}

interface CustomAgendaProps {
  events: Event[];
  onEventPress?: (event: Event) => void;
}

export const CustomAgenda: React.FC<CustomAgendaProps> = ({
  events,
  onEventPress,
}) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );

  // Group events by date
  const groupEventsByDate = (events: Event[]) => {
    const grouped: {[key: string]: Event[]} = {};
    events.forEach(event => {
      const date = event.start.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    return grouped;
  };

  const groupedEvents = groupEventsByDate(events);

  // Calendar marked dates
  const getMarkedDates = () => {
    const marked: any = {};

    Object.keys(groupedEvents).forEach(date => {
      marked[date] = {
        dots: groupedEvents[date].map((event, index) => ({
          color: event.color,
          key: event.id,
        })),
      };
    });

    // Selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: Colors.primary[500],
    };

    return marked;
  };

  // Get events for selected date
  const getEventsForDate = (date: string) => {
    return groupedEvents[date] || [];
  };

  // Get upcoming dates with events (for agenda list)
  const getUpcomingDates = () => {
    const today = new Date();
    const upcomingDates: string[] = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      if (groupedEvents[dateString]) {
        upcomingDates.push(dateString);
      }
    }

    return upcomingDates;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Calendar Section */}
      <View style={styles.calendarSection}>
        <Calendar
          markingType="multi-dot"
          markedDates={getMarkedDates()}
          onDayPress={day => setSelectedDate(day.dateString)}
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: Colors.neutral[600],
            selectedDayBackgroundColor: Colors.primary[500],
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: Colors.primary[500],
            dayTextColor: Colors.neutral[900],
            textDisabledColor: Colors.neutral[400],
            dotColor: Colors.primary[500],
            selectedDotColor: '#FFFFFF',
            arrowColor: Colors.primary[500],
            monthTextColor: Colors.neutral[900],
          }}
        />
      </View>

      {/* Agenda List Section */}
      <View style={styles.agendaSection}>
        <Text style={styles.agendaTitle}>📅 {formatDate(selectedDate)}</Text>

        <ScrollView
          style={styles.eventsList}
          showsVerticalScrollIndicator={false}>
          {getEventsForDate(selectedDate).length > 0 ? (
            getEventsForDate(selectedDate).map(event => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventItem, {borderLeftColor: event.color}]}
                onPress={() => onEventPress?.(event)}>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {event.start.split('T')[1]?.slice(0, 5) || ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.categoryBadge,
                    {backgroundColor: event.color},
                  ]}>
                  <Text style={styles.categoryText}>{event.category}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noEventsContainer}>
              <Text style={styles.noEventsText}>
                Bu tarihte etkinlik bulunmuyor
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Upcoming Events Section */}
        <View style={styles.upcomingSection}>
          <Text style={styles.upcomingSectionTitle}>Yaklaşan Etkinlikler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {getUpcomingDates()
              .slice(0, 5)
              .map(date => (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.upcomingDateCard,
                    selectedDate === date && styles.upcomingDateCardSelected,
                  ]}
                  onPress={() => setSelectedDate(date)}>
                  <Text style={styles.upcomingDateText}>
                    {new Date(date).getDate()}
                  </Text>
                  <Text style={styles.upcomingMonthText}>
                    {new Date(date).toLocaleDateString('tr-TR', {
                      month: 'short',
                    })}
                  </Text>
                  <View style={styles.upcomingEventCount}>
                    <Text style={styles.upcomingEventCountText}>
                      {getEventsForDate(date).length}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  calendarSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: DesignSystem.Spacing.md,
    marginTop: DesignSystem.Spacing.md,
    borderRadius: DesignSystem.BorderRadius.lg,
    ...DesignSystem.Shadows.sm,
  },
  agendaSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: DesignSystem.Spacing.md,
    marginTop: DesignSystem.Spacing.sm,
    marginBottom: DesignSystem.Spacing.md,
    borderRadius: DesignSystem.BorderRadius.lg,
    ...DesignSystem.Shadows.sm,
  },
  agendaTitle: {
    ...DesignSystem.Typography.h3,
    color: Colors.neutral[800],
    paddingHorizontal: DesignSystem.Spacing.md,
    paddingVertical: DesignSystem.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[100],
    borderTopLeftRadius: DesignSystem.BorderRadius.lg,
    borderTopRightRadius: DesignSystem.BorderRadius.lg,
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: DesignSystem.Spacing.md,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    borderLeftWidth: 4,
    paddingLeft: DesignSystem.Spacing.md,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    ...DesignSystem.Typography.body,
    color: Colors.neutral[900],
    fontWeight: '500',
  },
  eventTime: {
    ...DesignSystem.Typography.caption,
    color: Colors.neutral[600],
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: DesignSystem.Spacing.sm,
    paddingVertical: DesignSystem.Spacing.xs,
    borderRadius: DesignSystem.BorderRadius.sm,
  },
  categoryText: {
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
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  upcomingSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    paddingVertical: DesignSystem.Spacing.md,
  },
  upcomingSectionTitle: {
    ...DesignSystem.Typography.body,
    color: Colors.neutral[800],
    fontWeight: '600',
    marginHorizontal: DesignSystem.Spacing.md,
    marginBottom: DesignSystem.Spacing.sm,
  },
  upcomingDateCard: {
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    marginHorizontal: DesignSystem.Spacing.xs,
    marginLeft: DesignSystem.Spacing.md,
    paddingVertical: DesignSystem.Spacing.sm,
    paddingHorizontal: DesignSystem.Spacing.md,
    borderRadius: DesignSystem.BorderRadius.md,
    minWidth: 60,
  },
  upcomingDateCardSelected: {
    backgroundColor: Colors.primary[500],
  },
  upcomingDateText: {
    ...DesignSystem.Typography.h3,
    color: Colors.neutral[800],
    fontWeight: '600',
  },
  upcomingMonthText: {
    ...DesignSystem.Typography.caption,
    color: Colors.neutral[600],
  },
  upcomingEventCount: {
    backgroundColor: Colors.primary[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: DesignSystem.Spacing.xs,
  },
  upcomingEventCountText: {
    ...DesignSystem.Typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
