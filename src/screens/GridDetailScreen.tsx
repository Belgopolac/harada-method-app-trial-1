import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useHaradaGrids } from '../hooks/useHaradaGrids';
import { useCalendar } from '../hooks/useCalendar';
import { formatDate, calculateGridCompletion } from '../utils/harada';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'GridDetail'>;
type GridDetailRoute = RouteProp<RootStackParamList, 'GridDetail'>;

const GridDetailScreen = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<GridDetailRoute>();
  const { gridId } = route.params;
  const { getGridById, updateGrid, deleteGrid, setActiveGrid } = useHaradaGrids();
  const { addEvent } = useCalendar();
  const grid = getGridById(gridId);
  const [expandedPillars, setExpandedPillars] = useState<string[]>([]);

  if (!grid) {
    return <SafeAreaView style={styles.container}><View style={styles.empty}><Text style={styles.title}>Goal not found</Text><Button label="Go Back" onPress={() => navigation.goBack()} /></View></SafeAreaView>;
  }

  const togglePillar = (id: string) => setExpandedPillars(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const scheduleCell = async (pillarId: string, cellId: string, title: string, pillarTitle: string) => {
    if (!title.trim()) { Alert.alert('No action', 'Add an action before scheduling it.'); return; }
    const startDate = new Date();
    startDate.setHours(9, 0, 0, 0);
    const event = await addEvent({
      title,
      startDate,
      endDate: new Date(startDate.getTime() + 30 * 60000),
      description: `Harada Method: ${pillarTitle} - ${title}`,
      haradaGridId: grid.id,
      haradaPillarId: pillarId,
      haradaCellId: cellId,
    });
    if (event) Alert.alert('Scheduled', `“${title}” was added to your app calendar.`);
    else Alert.alert('Error', 'Could not schedule this action.');
  };
  const handleScheduleAll = async () => {
    const actions = grid.pillars.flatMap(pillar => pillar.cells.filter(cell => cell.text.trim()).map(cell => ({ pillar, cell })));
    let count = 0;
    for (const { pillar, cell } of actions) {
      const startDate = new Date();
      startDate.setHours(9 + (count % 8), 0, 0, 0);
      const event = await addEvent({
        title: cell.text,
        startDate,
        endDate: new Date(startDate.getTime() + 30 * 60000),
        description: `Harada Method: ${pillar.title} - ${cell.text}`,
        haradaGridId: grid.id,
        haradaPillarId: pillar.id,
        haradaCellId: cell.id,
      });
      if (event) count++;
    }
    Alert.alert('Calendar', `Scheduled ${count} actions in the app calendar.`);
  };
  const handleToggleCellComplete = (pillarId: string, cellId: string) => {
    const pillars = grid.pillars.map(pillar => pillar.id !== pillarId ? pillar : {
      ...pillar,
      cells: pillar.cells.map(cell => {
        if (cell.id !== cellId) return cell;
        const complete = !cell.isComplete;
        return { ...cell, isComplete: complete, completionCount: complete ? cell.completionCount + 1 : cell.completionCount, lastCompleted: complete ? new Date() : undefined, updatedAt: new Date() };
      }),
    });
    updateGrid(grid.id, { pillars });
  };
  const handleDelete = () => Alert.alert('Delete Goal', `Delete “${grid.title}”? This cannot be undone.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { deleteGrid(grid.id); navigation.goBack(); } },
  ]);
  const progress = calculateGridCompletion(grid);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{grid.title}</Text>
          <Text style={styles.muted}>Created: {formatDate(new Date(grid.createdAt))}</Text>
          <Text style={styles.muted}>Updated: {formatDate(new Date(grid.updatedAt))}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{progress}% Complete</Text>
          <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
          <Text style={styles.muted}>{grid.pillars.length} pillars · {grid.pillars.reduce((sum, p) => sum + p.cells.length, 0)} actions · {grid.pillars.reduce((sum, p) => sum + p.cells.filter(c => c.isComplete).length, 0)} completed</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Main Goal</Text>
          <Text style={styles.goal}>{grid.mainGoal || 'No main goal set'}</Text>
          {!!grid.mainGoalDescription && <Text style={styles.muted}>{grid.mainGoalDescription}</Text>}
        </View>
        <View style={styles.row}>
          <Button label={grid.isActive ? 'Active Goal' : 'Set Active'} onPress={() => setActiveGrid(grid.id)} />
          <Button label="Schedule Actions" onPress={handleScheduleAll} />
        </View>
        <Text style={styles.sectionTitle}>Supporting Pillars</Text>
        {grid.pillars.map(pillar => {
          const expanded = expandedPillars.includes(pillar.id);
          const done = pillar.cells.filter(cell => cell.isComplete).length;
          return <View key={pillar.id} style={styles.card}>
            <TouchableOpacity onPress={() => togglePillar(pillar.id)} style={[styles.pillarHeader, { backgroundColor: pillar.color || '#6200EE' }]}>
              <View style={{ flex: 1 }}><Text style={styles.pillarTitle}>{pillar.title || 'Untitled Pillar'}</Text><Text style={styles.pillarInfo}>{pillar.description || `${done}/${pillar.cells.length} complete`}</Text></View>
              <Text style={styles.pillarTitle}>{expanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>
            {expanded && pillar.cells.map((cell, index) => <View key={cell.id} style={styles.cell}>
              <TouchableOpacity style={[styles.checkbox, cell.isComplete && styles.checked]} onPress={() => handleToggleCellComplete(pillar.id, cell.id)}><Text style={styles.checkmark}>{cell.isComplete ? '✓' : ''}</Text></TouchableOpacity>
              <Text style={[styles.cellText, cell.isComplete && styles.completedText]}>{index + 1}. {cell.text || 'Empty action'}</Text>
              <TouchableOpacity onPress={() => scheduleCell(pillar.id, cell.id, cell.text, pillar.title)}><Text style={styles.link}>Schedule</Text></TouchableOpacity>
            </View>)}
          </View>;
        })}
        <View style={styles.row}>
          <Button label="Edit Goal" onPress={() => navigation.navigate('GridEditor', { gridId })} />
          <Button label="Share" onPress={() => Share.share({ message: `${grid.title}\n${grid.mainGoal}\nProgress: ${progress}%` })} />
          <Button label="Delete" onPress={handleDelete} danger />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Button = ({ label, onPress, danger = false }: { label: string; onPress: () => void; danger?: boolean }) => <TouchableOpacity style={[styles.button, danger && styles.danger]} onPress={onPress}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' }, content: { padding: 20, paddingBottom: 40 }, header: { alignItems: 'center', marginBottom: 18 }, title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 6 }, muted: { color: '#777', fontSize: 13, marginTop: 4 }, card: { backgroundColor: 'white', borderRadius: 12, marginBottom: 14, overflow: 'hidden', elevation: 2 }, sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', margin: 14 }, track: { height: 8, backgroundColor: '#E0E0E0', marginHorizontal: 14, borderRadius: 4, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: '#6200EE' }, goal: { fontSize: 17, color: '#333', textAlign: 'center', marginHorizontal: 14, marginBottom: 12 }, row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 }, button: { flex: 1, backgroundColor: '#6200EE', borderRadius: 9, padding: 12, alignItems: 'center', justifyContent: 'center' }, danger: { backgroundColor: '#D32F2F' }, buttonText: { color: 'white', fontSize: 13, fontWeight: '600', textAlign: 'center' }, pillarHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 }, pillarTitle: { color: 'white', fontWeight: 'bold', fontSize: 15 }, pillarInfo: { color: 'white', fontSize: 12, marginTop: 3 }, cell: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderColor: '#EEE', gap: 9 }, checkbox: { width: 23, height: 23, borderWidth: 1, borderColor: '#AAA', borderRadius: 4, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }, checkmark: { color: 'white', fontWeight: 'bold' }, cellText: { flex: 1, color: '#333', fontSize: 13 }, completedText: { textDecorationLine: 'line-through', color: '#888' }, link: { color: '#6200EE', fontSize: 12, fontWeight: '600' }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});

export default GridDetailScreen;
