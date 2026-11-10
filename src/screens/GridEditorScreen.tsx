import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Alert, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useHaradaGrids } from '../hooks/useHaradaGrids';
import { generateId } from '../utils/harada';

type GridEditorScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GridEditor'>;
type GridEditorScreenRouteProp = RouteProp<RootStackParamList, 'GridEditor'>;
const { width } = Dimensions.get('window');

const GridEditorScreen = () => {
  const navigation = useNavigation<GridEditorScreenNavigationProp>();
  const route = useRoute<GridEditorScreenRouteProp>();
  const { gridId } = route.params || {};
  const { getGridById, updateGrid, updateMainGoal, updatePillar, updateCell, createGrid, addPillar, removePillar } = useHaradaGrids();
  const grid = gridId ? getGridById(gridId) : null;
  const isNewGrid = !gridId || !grid;

  const [title, setTitle] = useState(grid?.title || '');
  const [mainGoal, setMainGoal] = useState(grid?.mainGoal || '');
  const [mainGoalDescription, setMainGoalDescription] = useState(grid?.mainGoalDescription || '');
  const [pillars, setPillars] = useState(grid?.pillars.map(p => ({ ...p, cells: p.cells.map(c => ({ ...c })) })) || []);

  useEffect(() => {
    if (grid) {
      setTitle(grid.title);
      setMainGoal(grid.mainGoal);
      setMainGoalDescription(grid.mainGoalDescription || '');
      setPillars(grid.pillars.map(p => ({ ...p, cells: p.cells.map(c => ({ ...c })) })));
    }
  }, [grid]);

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a title for your goal'); return; }
    if (!mainGoal.trim()) { Alert.alert('Error', 'Please enter a main goal'); return; }

    if (isNewGrid) {
      const newGrid = createGrid(title);
      updateGrid(newGrid.id, { mainGoal, mainGoalDescription: mainGoalDescription.trim() });
      pillars.forEach(pillar => addPillar(newGrid.id, pillar.title));
      navigation.navigate('GridDetail', { gridId: newGrid.id });
    } else if (grid) {
      updateGrid(grid.id, { title: title.trim(), mainGoal: mainGoal.trim(), mainGoalDescription: mainGoalDescription.trim() });
      pillars.forEach(pillar => {
        updatePillar(grid.id, pillar.id, { title: pillar.title.trim(), description: pillar.description?.trim() });
        pillar.cells.forEach(cell => updateCell(grid.id, pillar.id, cell.id, { text: cell.text.trim(), description: cell.description?.trim() }));
      });
      navigation.goBack();
    }
  };

  const handleAddPillar = () => {
    if (pillars.length >= 8) { Alert.alert('Limit Reached', 'You can have a maximum of 8 pillars'); return; }
    const newPillar = {
      id: generateId(),
      title: `Pillar ${pillars.length + 1}`,
      description: '',
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      cells: Array(8).fill(null).map(() => ({
        id: generateId(),
        text: '',
        isComplete: false,
        completionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };
    setPillars([...pillars, newPillar]);
  };

  const handleRemovePillar = (pillarId: string) => {
    if (pillars.length <= 1) { Alert.alert('Error', 'You must have at least one pillar'); return; }
    Alert.alert('Remove Pillar', 'Are you sure you want to remove this pillar? All its actions will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { if (grid) removePillar(grid.id, pillarId); setPillars(pillars.filter(p => p.id !== pillarId)); } }
    ]);
  };

  const handleUpdatePillarTitle = (pillarId: string, text: string) => {
    setPillars(pillars.map(p => (p.id === pillarId ? { ...p, title: text } : p)));
  };

  const handleUpdateCellText = (pillarId: string, cellId: string, text: string) => {
    setPillars(pillars.map(p => {
      if (p.id !== pillarId) return p;
      return { ...p, cells: p.cells.map(c => c.id === cellId ? { ...c, text } : c) };
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoiding}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.header}><Text style={styles.title}>{isNewGrid ? 'Create New Goal' : 'Edit Goal'}</Text></View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter a title for your goal" placeholderTextColor="#999" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Main Goal</Text>
            <TextInput style={[styles.input, styles.largeInput]} value={mainGoal} onChangeText={setMainGoal} placeholder="What is your main goal?" placeholderTextColor="#999" multiline numberOfLines={3} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal Description (Optional)</Text>
            <TextInput style={[styles.input, styles.largeInput]} value={mainGoalDescription} onChangeText={setMainGoalDescription} placeholder="Describe your goal in more detail" placeholderTextColor="#999" multiline numberOfLines={3} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Supporting Pillars</Text>
              <Text style={styles.sectionHelp}>Each pillar represents an area that supports your main goal</Text>
            </View>
            {pillars.map((pillar, pillarIndex) => (
              <View key={pillar.id} style={styles.pillarContainer}>
                <View style={styles.pillarHeader}>
                  <TextInput style={[styles.input, styles.pillarTitleInput]} value={pillar.title} onChangeText={(text) => handleUpdatePillarTitle(pillar.id, text)} placeholder={`Pillar ${pillarIndex + 1}`} placeholderTextColor="#999" />
                  <TouchableOpacity style={styles.removePillarButton} onPress={() => handleRemovePillar(pillar.id)}><Text style={styles.removePillarText}>×</Text></TouchableOpacity>
                </View>
                <View style={styles.cellsContainer}>
                  {pillar.cells.map((cell, cellIndex) => (
                    <TextInput key={cell.id} style={[styles.input, styles.cellInput]} value={cell.text} onChangeText={(text) => handleUpdateCellText(pillar.id, cell.id, text)} placeholder={`Action ${cellIndex + 1}`} placeholderTextColor="#999" multiline numberOfLines={2} />
                  ))}
                </View>
              </View>
            ))}
            {pillars.length < 8 && (
              <TouchableOpacity style={styles.addPillarButton} onPress={handleAddPillar}><Text style={styles.addPillarText}>+ Add Pillar</Text></TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}><Text style={styles.saveButtonText}>Save Goal</Text></TouchableOpacity>
          {!isNewGrid && (
            <TouchableOpacity style={[styles.saveButton, styles.cancelButton]} onPress={() => navigation.goBack()}><Text style={[styles.saveButtonText, styles.cancelButtonText]}>Cancel</Text></TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  keyboardAvoiding: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, fontSize: 16, color: '#333' },
  largeInput: { minHeight: 80, textAlignVertical: 'top' },
  section: { marginBottom: 20 },
  sectionHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  sectionHelp: { fontSize: 14, color: '#666', lineHeight: 18 },
  pillarContainer: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  pillarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  pillarTitleInput: { flex: 1, fontWeight: 'bold', fontSize: 16 },
  removePillarButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  removePillarText: { fontSize: 18, color: '#D32F2F', fontWeight: 'bold' },
  cellsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cellInput: { flex: 1, minWidth: width / 2 - 30, minHeight: 60, fontSize: 14, textAlignVertical: 'top' },
  addPillarButton: { backgroundColor: '#E8F5E8', borderRadius: 10, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#A5D6A7', borderStyle: 'dashed' },
  addPillarText: { fontSize: 14, color: '#388E3C', fontWeight: '500' },
  saveButton: { backgroundColor: '#6200EE', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  saveButtonText: { fontSize: 16, color: 'white', fontWeight: '600' },
  cancelButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CCC' },
  cancelButtonText: { color: '#666' },
});

export default GridEditorScreen;
