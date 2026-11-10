import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useHaradaGrids } from '../hooks/useHaradaGrids';
import { useCalendar } from '../hooks/useCalendar';
import { getDailyActions, formatDate } from '../utils/harada';

type DailyRoutineScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DailyRoutine'>;
const { width } = Dimensions.get('window');

const DailyRoutineScreen = () => {
  const navigation = useNavigation<DailyRoutineScreenNavigationProp>();
  const { getActiveGrid, toggleCellCompletion } = useHaradaGrids();
  const { scheduleHaradaAction, permissionsGranted, requestPermissions } = useCalendar();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCompleted, setShowCompleted] = useState(true);

  const activeGrid = getActiveGrid();
  const dailyActions = activeGrid ? getDailyActions(activeGrid) : [];
  const incompleteActions = dailyActions.filter(({ cell }) => !cell.isComplete);
  const completedActions = dailyActions.filter(({ cell }) => cell.isComplete);
  const visibleActions = showCompleted ? dailyActions : incompleteActions;

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleToggleCompletion = (pillarId: string, cellId: string) => {
    if (activeGrid) toggleCellCompletion(activeGrid.id, pillarId, cellId);
  };

  const handleScheduleAction = async (pillar: any, cell: any) => {
    if (!permissionsGranted) {
      const granted = await requestPermissions();
      if (!granted) { Alert.alert('Calendar Permission Required', 'Please grant calendar permissions to schedule actions.'); return; }
    }
    const today = new Date(); today.setHours(9, 0, 0, 0);
    await scheduleHaradaAction(cell.text, `Harada Method: ${pillar.title} - ${cell.text}`, today, 30, activeGrid?.id, pillar.id, cell.id);
    Alert.alert('Success', `"${cell.text}" scheduled in your calendar`);
  };

  const handleScheduleAll = async () => {
    if (!activeGrid) return;
    if (!permissionsGranted) {
      const granted = await requestPermissions();
      if (!granted) { Alert.alert('Calendar Permission Required', 'Please grant calendar permissions to schedule actions.'); return; }
    }
    let currentTime = new Date(); currentTime.setHours(9, 0, 0, 0);
    for (const { pillar, cell } of incompleteActions) {
      await scheduleHaradaAction(cell.text, `Harada Method: ${pillar.title} - ${cell.text}`, currentTime, 30, activeGrid.id, pillar.id, cell.id);
      currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }
    Alert.alert('Success', `${incompleteActions.length} actions scheduled in your calendar`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Daily Routine</Text>
          <Text style={styles.subtitle}>{formatDate(selectedDate)}</Text>
        </View>

        <View style={styles.dateNavigator}>
          <TouchableOpacity style={styles.dateButton} onPress={() => handleDateChange(-1)}><Text style={styles.dateButtonText}>← Yesterday</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.dateButton, styles.todayButton]} onPress={() => setSelectedDate(new Date())}><Text style={[styles.dateButtonText, styles.todayButtonText]}>Today</Text></TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={() => handleDateChange(1)}><Text style={styles.dateButtonText}>Tomorrow →</Text></TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}><Text style={styles.statValue}>{incompleteActions.length}</Text><Text style={styles.statLabel}>To Do</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{completedActions.length}</Text><Text style={styles.statLabel}>Completed</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{dailyActions.length}</Text><Text style={styles.statLabel}>Total</Text></View>
        </View>

        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Show:</Text>
          <TouchableOpacity style={[styles.filterButton, !showCompleted && styles.filterButtonActive]} onPress={() => setShowCompleted(false)}>
            <Text style={[styles.filterButtonText, !showCompleted && styles.filterButtonTextActive]}>Incomplete Only</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterButton, showCompleted && styles.filterButtonActive]} onPress={() => setShowCompleted(true)}>
            <Text style={[styles.filterButtonText, showCompleted && styles.filterButtonTextActive]}>All Actions</Text>
          </TouchableOpacity>
        </View>

        {!activeGrid ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active goal selected</Text>
            <Text style={styles.emptySubtext}>Please select or create a goal to see your daily actions</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('GridList')}>
              <Text style={styles.createButtonText}>Select a Goal</Text>
            </TouchableOpacity>
          </View>
        ) : visibleActions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No actions for today</Text>
            <Text style={styles.emptySubtext}>Add actions to your goal pillars to see them here</Text>
          </View>
        ) : (
          <View style={styles.actionsContainer}>
            {visibleActions.map(({ pillar, cell }) => (
              <View key={cell.id} style={[styles.actionCard, cell.isComplete && styles.actionCardCompleted]}>
                <View style={styles.actionHeader}>
                  <Text style={[styles.pillarTitle, { color: pillar.color || '#6200EE' }]}>{pillar.title || 'Untitled Pillar'}</Text>
                  <TouchableOpacity style={styles.scheduleButton} onPress={() => handleScheduleAction(pillar, cell)}>
                    <Text style={styles.scheduleButtonText}>Schedule</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.actionContent} onPress={() => handleToggleCompletion(pillar.id, cell.id)}>
                  <Text style={[styles.actionText, cell.isComplete && styles.actionTextCompleted]} numberOfLines={2}>{cell.text || 'Untitled Action'}</Text>
                  <View style={styles.checkbox}>{cell.isComplete && <Text style={styles.checkmark}>✓</Text>}</View>
                </TouchableOpacity>
                {cell.completionCount > 0 && <Text style={styles.completionInfo}>Completed {cell.completionCount} time{cell.completionCount > 1 ? 's' : ''}</Text>}
              </View>
            ))}
          </View>
        )}

        {activeGrid && incompleteActions.length > 0 && (
          <TouchableOpacity style={styles.scheduleAllButton} onPress={handleScheduleAll}>
            <Text style={styles.scheduleAllButtonText}>Schedule All Incomplete Actions</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666' },
  dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dateButton: { padding: 10 },
  dateButtonText: { fontSize: 14, color: '#6200EE', fontWeight: '500' },
  todayButton: { backgroundColor: '#6200EE', borderRadius: 8 },
  todayButtonText: { color: 'white' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#6200EE' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 5 },
  filterContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  filterLabel: { fontSize: 14, color: '#666', marginRight: 15 },
  filterButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 },
  filterButtonActive: { backgroundColor: '#6200EE', borderColor: '#6200EE' },
  filterButtonText: { fontSize: 12, color: '#666' },
  filterButtonTextActive: { color: 'white' },
  emptyContainer: { alignItems: 'center', padding: 40, backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20 },
  createButton: { backgroundColor: '#6200EE', borderRadius: 10, paddingHorizontal: 25, paddingVertical: 12 },
  createButtonText: { fontSize: 14, color: 'white', fontWeight: '600' },
  actionsContainer: { marginBottom: 20 },
  actionCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  actionCardCompleted: { backgroundColor: '#E8F5E8', borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  actionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pillarTitle: { fontSize: 12, fontWeight: '600' },
  scheduleButton: { backgroundColor: '#E3F2FD', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  scheduleButtonText: { fontSize: 10, color: '#1976D2', fontWeight: '500' },
  actionContent: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 16, color: '#333', flex: 1, lineHeight: 20 },
  actionTextCompleted: { color: '#666', textDecorationLine: 'line-through' },
  checkbox: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  checkmark: { fontSize: 16, color: '#4CAF50', fontWeight: 'bold' },
  completionInfo: { fontSize: 10, color: '#888', marginTop: 8, textAlign: 'right' },
  scheduleAllButton: { backgroundColor: '#6200EE', borderRadius: 12, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  scheduleAllButtonText: { fontSize: 16, color: 'white', fontWeight: '600' }
});

export default DailyRoutineScreen;
