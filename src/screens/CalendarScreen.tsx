import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, Dimensions } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useCalendar } from '../hooks/useCalendar';
import { useHaradaGrids } from '../hooks/useHaradaGrids';
import { formatDate, formatTime } from '../utils/harada';

type CalendarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Calendar'>;
const { width } = Dimensions.get('window');

const CalendarScreen = () => {
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const { events, loading, permissionsGranted, canRequestPermissions, requestPermissions, syncWithNativeCalendar, getEventsForDate, deleteEvent } = useCalendar();
  const { grids, getGridById } = useHaradaGrids();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [showHaradaOnly, setShowHaradaOnly] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      if (selectedDate) {
        const dateObj = new Date(selectedDate + 'T00:00:00Z');
        const eventsForDate = await getEventsForDate(dateObj);
        setSelectedDateEvents(eventsForDate);
      }
    };
    loadEvents();
  }, [selectedDate, getEventsForDate]);

  const handleDateSelected = (day: DateData) => setSelectedDate(day.dateString);

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (granted) Alert.alert('Success', 'Calendar permissions granted!');
    else Alert.alert('Error', 'Calendar permissions are required to sync events');
  };

  const handleSync = async () => {
    if (!permissionsGranted) { Alert.alert('Error', 'Please grant calendar permissions first'); return; }
    const syncedCount = await syncWithNativeCalendar();
    Alert.alert('Success', `${syncedCount} events synced with native calendar`);
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteEvent(eventId);
        const dateObj = new Date(selectedDate + 'T00:00:00Z');
        const eventsForDate = await getEventsForDate(dateObj);
        setSelectedDateEvents(eventsForDate);
      }}
    ]);
  };

  const handleScheduleFromGrid = () => {
    const activeGrid = grids.find(g => g.isActive);
    if (!activeGrid) { Alert.alert('Error', 'No active goal selected'); return; }
    Alert.alert('Schedule from Goal', 'Select a goal to schedule actions from',
      grids.map(grid => ({ text: grid.title, onPress: () => navigation.navigate('GridDetail', { gridId: grid.id }) })));
  };

  const getGridName = (event: any): string => {
    if (!event.haradaGridId) return '';
    const grid = getGridById(event.haradaGridId);
    return grid ? grid.title : 'Unknown Goal';
  };

  const filteredEvents = showHaradaOnly ? selectedDateEvents.filter(e => e.isHaradaEvent) : selectedDateEvents;

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>{formatDate(new Date(selectedDate))}</Text>
        </View>

        {!permissionsGranted && canRequestPermissions && (
          <View style={styles.permissionBanner}>
            <Text style={styles.permissionText}>Grant calendar permissions to sync events with your device calendar</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermissions}>
              <Text style={styles.permissionButtonText}>Grant Permissions</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.calendarContainer}>
          <Calendar onDayPress={handleDateSelected} markedDates={{
            [selectedDate]: { selected: true, selectedColor: '#6200EE', selectedTextColor: 'white' }
          }} theme={{
            backgroundColor: 'white', calendarBackground: 'white', textSectionTitleColor: '#333',
            selectedDayBackgroundColor: '#6200EE', selectedDayTextColor: 'white', todayTextColor: '#6200EE',
            dayTextColor: '#333', textDisabledColor: '#CCC', dotColor: '#6200EE', selectedDotColor: 'white',
            arrowColor: '#6200EE', monthTextColor: '#333', indicatorColor: '#6200EE'
          }} style={styles.calendar} />
        </View>

        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Show:</Text>
          <TouchableOpacity style={[styles.filterButton, !showHaradaOnly && styles.filterButtonActive]} onPress={() => setShowHaradaOnly(false)}>
            <Text style={[styles.filterButtonText, !showHaradaOnly && styles.filterButtonTextActive]}>All Events</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, showHaradaOnly && styles.filterButtonActive]} onPress={() => setShowHaradaOnly(true)}>
            <Text style={[styles.filterButtonText, showHaradaOnly && styles.filterButtonTextActive]}>Harada Only</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.eventsSection}>
          <Text style={styles.eventsTitle}>Events on {formatDate(new Date(selectedDate))}</Text>
          {filteredEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events for this date</Text>
              <TouchableOpacity style={styles.scheduleButton} onPress={handleScheduleFromGrid}>
                <Text style={styles.scheduleButtonText}>Schedule from Goal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(event => (
              <View key={event.id} style={[styles.eventCard, event.isHaradaEvent && styles.haradaEventCard]}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTime}>{formatTime(new Date(event.startDate))}</Text>
                  {event.isHaradaEvent && <Text style={styles.haradaBadge}>Harada</Text>}
                </View>
                <Text style={styles.eventTitle}>{event.title}</Text>
                {event.description && <Text style={styles.eventDescription} numberOfLines={2}>{event.description}</Text>}
                {event.isHaradaEvent && <Text style={styles.eventGrid}>Goal: {getGridName(event)}</Text>}
                <TouchableOpacity style={styles.eventDelete} onPress={() => handleDeleteEvent(event.id)}>
                  <Text style={styles.eventDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {permissionsGranted && (
          <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
            <Text style={styles.syncButtonText}>Sync with Device Calendar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#666' },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666' },
  permissionBanner: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 15, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  permissionText: { fontSize: 14, color: '#E65100', flex: 1, marginRight: 10 },
  permissionButton: { backgroundColor: '#FF9800', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 8 },
  permissionButtonText: { fontSize: 12, color: 'white', fontWeight: '600' },
  calendarContainer: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  calendar: { borderRadius: 8, overflow: 'hidden' },
  filterContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  filterLabel: { fontSize: 14, color: '#666', marginRight: 15 },
  filterButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 },
  filterButtonActive: { backgroundColor: '#6200EE', borderColor: '#6200EE' },
  filterButtonText: { fontSize: 12, color: '#666' },
  filterButtonTextActive: { color: 'white' },
  eventsSection: { marginBottom: 20 },
  eventsTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  emptyContainer: { alignItems: 'center', padding: 40, backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  emptyText: { fontSize: 14, color: '#666', marginBottom: 15 },
  scheduleButton: { backgroundColor: '#6200EE', borderRadius: 10, paddingHorizontal: 25, paddingVertical: 12 },
  scheduleButtonText: { fontSize: 14, color: 'white', fontWeight: '600' },
  eventCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  haradaEventCard: { borderLeftWidth: 4, borderLeftColor: '#6200EE' },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventTime: { fontSize: 12, color: '#888' },
  haradaBadge: { backgroundColor: '#6200EE', color: 'white', fontSize: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontWeight: '500' },
  eventTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 5 },
  eventDescription: { fontSize: 12, color: '#666', marginBottom: 5, lineHeight: 16 },
  eventGrid: { fontSize: 10, color: '#999', marginBottom: 10 },
  eventDelete: { alignSelf: 'flex-end' },
  eventDeleteText: { fontSize: 12, color: '#D32F2F', fontWeight: '500' },
  syncButton: { backgroundColor: '#4CAF50', borderRadius: 12, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  syncButtonText: { fontSize: 16, color: 'white', fontWeight: '600' }
});

export default CalendarScreen;
