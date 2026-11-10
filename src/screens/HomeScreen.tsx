import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useHaradaGrids } from '../hooks/useHaradaGrids';
import { calculateGridCompletion } from '../utils/harada';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { grids, activeGridId, getActiveGrid, loading } = useHaradaGrids();
  const activeGrid = getActiveGrid();

  const handleNavigate = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  const handleGridPress = (gridId: string) => {
    navigation.navigate('GridDetail', { gridId });
  };

  const completionPercentage = activeGrid ? calculateGridCompletion(activeGrid) : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Harada Method</Text>
          <Text style={styles.subtitle}>Achieve Your Ambitious Goals</Text>
        </View>

        {activeGrid ? (
          <TouchableOpacity style={styles.activeGoalCard} onPress={() => handleGridPress(activeGrid.id)}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>{activeGrid.title}</Text>
              <Text style={styles.completionText}>{completionPercentage}% Complete</Text>
            </View>
            <Text style={styles.goalMain} numberOfLines={2}>{activeGrid.mainGoal || 'Set your main goal'}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
            </View>
            <Text style={styles.pillarsText}>{activeGrid.pillars.filter(p => p.title.trim()).length} pillars defined</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.activeGoalCard} onPress={() => handleNavigate('GridList')}>
            <Text style={styles.goalTitle}>Create Your First Goal</Text>
            <Text style={styles.goalSubtitle}>Tap to create a Harada Method grid and start achieving your dreams</Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => handleNavigate('DailyRoutine')}>
              <Text style={styles.quickActionIcon}>📅</Text><Text style={styles.quickActionText}>Daily Routine</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => handleNavigate('Calendar')}>
              <Text style={styles.quickActionIcon}>📆</Text><Text style={styles.quickActionText}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => handleNavigate('Diary')}>
              <Text style={styles.quickActionIcon}>📖</Text><Text style={styles.quickActionText}>Diary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => handleNavigate('GridList')}>
              <Text style={styles.quickActionIcon}>🎯</Text><Text style={styles.quickActionText}>My Goals</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => handleNavigate('Weather')}>
              <Text style={styles.quickActionIcon}>🌤️</Text><Text style={styles.quickActionText}>Weather</Text>
            </TouchableOpacity>
          </View>
        </View>

        {grids.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Goals</Text>
            <View style={styles.gridsList}>
              {grids.slice(0, 3).map(grid => (
                <TouchableOpacity key={grid.id} style={[styles.gridCard, activeGridId === grid.id && styles.activeGridCard]} onPress={() => handleGridPress(grid.id)}>
                  <Text style={styles.gridCardTitle} numberOfLines={1}>{grid.title}</Text>
                  <Text style={styles.gridCardGoal} numberOfLines={1}>{grid.mainGoal || 'No goal set'}</Text>
                  <Text style={styles.gridCardMeta}>{grid.pillars.filter(p => p.title.trim()).length} pillars</Text>
                </TouchableOpacity>
              ))}
            </View>
            {grids.length > 3 && <TouchableOpacity style={styles.seeAllButton} onPress={() => handleNavigate('GridList')}><Text style={styles.seeAllText}>See All Goals</Text></TouchableOpacity>}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Harada Method</Text>
          <Text style={styles.infoText}>The Harada Method is a goal-achievement framework developed by Japanese track coach Takashi Harada. It breaks down ambitious goals into 8 supporting pillars with 8 actions each, creating a 64-cell grid of actionable steps.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' }, scrollContainer: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { fontSize: 18, color: '#666' },
  header: { marginBottom: 20, alignItems: 'center' }, title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 5 }, subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  activeGoalCard: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, goalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' }, goalMain: { fontSize: 16, color: '#555', marginBottom: 15, lineHeight: 22 }, goalSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 10 }, completionText: { fontSize: 14, color: '#6200EE', fontWeight: '600' }, progressBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, marginBottom: 10, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: '#6200EE', borderRadius: 4 }, pillarsText: { fontSize: 12, color: '#999', textAlign: 'right' },
  section: { marginBottom: 25 }, sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 }, quickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, quickActionButton: { width: width / 2 - 25, backgroundColor: 'white', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }, quickActionIcon: { fontSize: 30, marginBottom: 10 }, quickActionText: { fontSize: 14, color: '#555', fontWeight: '500' },
  gridsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, gridCard: { width: width / 2 - 25, backgroundColor: 'white', borderRadius: 12, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }, activeGridCard: { borderWidth: 2, borderColor: '#6200EE' }, gridCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 }, gridCardGoal: { fontSize: 12, color: '#666', marginBottom: 8 }, gridCardMeta: { fontSize: 10, color: '#999' }, seeAllButton: { alignSelf: 'center', marginTop: 15 }, seeAllText: { fontSize: 14, color: '#6200EE', fontWeight: '500' },
  infoSection: { backgroundColor: 'white', borderRadius: 15, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 }, infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 }, infoText: { fontSize: 14, color: '#666', lineHeight: 20 },
});

export default HomeScreen;
