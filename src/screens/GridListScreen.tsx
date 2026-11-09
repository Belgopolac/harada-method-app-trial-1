import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useHaradaGrids } from '../hooks/useHaradaGrids';
import { calculateGridCompletion } from '../utils/harada';

type GridListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GridList'>;
const { width } = Dimensions.get('window');

const GridListScreen = () => {
  const navigation = useNavigation<GridListScreenNavigationProp>();
  const { grids, activeGridId, createGrid, deleteGrid, setActiveGrid, loading } = useHaradaGrids();

  const handleCreateGrid = () => {
    const newGrid = createGrid('New Goal');
    navigation.navigate('GridEditor', { gridId: newGrid.id });
  };

  const handleGridPress = (gridId: string) => {
    navigation.navigate('GridDetail', { gridId });
  };

  const handleEditGrid = (gridId: string) => {
    navigation.navigate('GridEditor', { gridId });
  };

  const handleDeleteGrid = (gridId: string) => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal? This action cannot be undone.',
      [{ text: 'Cancel', style: 'cancel' },
       { text: 'Delete', style: 'destructive', onPress: () => deleteGrid(gridId) }]);
  };

  const handleSetActive = (gridId: string) => {
    setActiveGrid(gridId);
  };

  const completionPercentage = (grid: any) => calculateGridCompletion(grid);
  const sortedGrids = [...grids].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>My Harada Goals</Text>
          <Text style={styles.subtitle}>{grids.length} goal{grids.length !== 1 ? 's' : ''} created</Text>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={handleCreateGrid}>
          <Text style={styles.createButtonText}>+ Create New Goal</Text>
        </TouchableOpacity>

        {activeGridId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Goal</Text>
            {grids.filter(grid => grid.id === activeGridId).map(grid => (
              <View key={grid.id} style={styles.gridCardActive}>
                <TouchableOpacity style={styles.gridContent} onPress={() => handleGridPress(grid.id)}>
                  <Text style={styles.gridTitle}>{grid.title}</Text>
                  <Text style={styles.gridGoal} numberOfLines={2}>{grid.mainGoal || 'No goal set'}</Text>
                  <View style={styles.gridMeta}>
                    <Text style={styles.gridPillars}>{grid.pillars.filter((p: any) => p.title.trim()).length} pillars</Text>
                    <Text style={styles.gridCompletion}>{completionPercentage(grid)}% complete</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${completionPercentage(grid)}%` }]} />
                  </View>
                </TouchableOpacity>
                <View style={styles.gridActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleEditGrid(grid.id)}>
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteGrid(grid.id)}>
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Goals</Text>
          {sortedGrids.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No goals created yet.</Text>
              <Text style={styles.emptySubtext}>Tap the "Create New Goal" button to get started with the Harada Method.</Text>
            </View>
          ) : (
            sortedGrids.map(grid => (
              <View key={grid.id} style={[styles.gridCard, activeGridId === grid.id && styles.gridCardActive]}>
                <TouchableOpacity style={styles.gridContent} onPress={() => handleGridPress(grid.id)}>
                  <Text style={styles.gridTitle}>{grid.title}</Text>
                  <Text style={styles.gridGoal} numberOfLines={1}>{grid.mainGoal || 'No goal set'}</Text>
                  <View style={styles.gridMeta}>
                    <Text style={styles.gridPillars}>{grid.pillars.filter((p: any) => p.title.trim()).length} pillars</Text>
                    <Text style={styles.gridCompletion}>{completionPercentage(grid)}% complete</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${completionPercentage(grid)}%` }]} />
                  </View>
                </TouchableOpacity>
                <View style={styles.gridActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleEditGrid(grid.id)}>
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteGrid(grid.id)}>
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                  {activeGridId !== grid.id && (
                    <TouchableOpacity style={[styles.actionButton, styles.activateButton]} onPress={() => handleSetActive(grid.id)}>
                      <Text style={[styles.actionButtonText, styles.activateButtonText]}>Activate</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
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
  createButton: { backgroundColor: '#6200EE', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  createButtonText: { fontSize: 16, color: 'white', fontWeight: '600' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  gridCard: { backgroundColor: 'white', borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  gridCardActive: { borderWidth: 2, borderColor: '#6200EE' },
  gridContent: { padding: 20 },
  gridTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  gridGoal: { fontSize: 14, color: '#666', marginBottom: 10, lineHeight: 18 },
  gridMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  gridPillars: { fontSize: 12, color: '#888' },
  gridCompletion: { fontSize: 12, color: '#6200EE', fontWeight: '500' },
  progressBar: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6200EE', borderRadius: 3 },
  gridActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 15, backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  actionButton: { backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 8, marginLeft: 10 },
  actionButtonText: { fontSize: 12, color: '#555', fontWeight: '500' },
  deleteButton: { backgroundColor: '#FFEBEE' },
  deleteButtonText: { color: '#D32F2F' },
  activateButton: { backgroundColor: '#E8F5E8' },
  activateButtonText: { color: '#388E3C' },
  emptyContainer: { alignItems: 'center', padding: 40, backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
});

export default GridListScreen;
