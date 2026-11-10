import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, Dimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, DiaryEntry } from '../types';
import { getDiaryEntries, saveDiaryEntries } from '../utils/storage';
import { formatDate } from '../utils/harada';

type DiaryNavigation = NativeStackNavigationProp<RootStackParamList, 'Diary'>;
const { width } = Dimensions.get('window');

const toDate = (value: string | Date | undefined): Date => {
  const parsed = value instanceof Date ? value : new Date(value ?? Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};
const localDateKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const DiaryScreen = () => {
  const navigation = useNavigation<DiaryNavigation>();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await getDiaryEntries();
      const normalized: DiaryEntry[] = stored.map((item: any) => ({
        ...item,
        date: toDate(item.date).toISOString(),
        createdAt: toDate(item.createdAt).toISOString(),
        updatedAt: toDate(item.updatedAt).toISOString(),
        reflections: Array.isArray(item.reflections) ? item.reflections : [],
        tags: Array.isArray(item.tags) ? item.tags : [],
        mood: Number(item.mood) || 3,
      }));
      setEntries(normalized);
    } catch (error) {
      console.error('Failed to load diary entries:', error);
      Alert.alert('Diary', 'Could not load diary entries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadEntries();
  }, [loadEntries]));

  const entriesForDate = entries.filter(entry => localDateKey(toDate(entry.date)) === localDateKey(selectedDate));
  const allTags = Array.from(new Set(entries.flatMap(entry => entry.tags))).sort();
  const visibleEntries = (filterTag ? entriesForDate.filter(entry => entry.tags.includes(filterTag)) : entriesForDate)
    .slice().sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());

  const getMoodEmoji = (mood: number): string => ['😔', '😐', '😬', '😊', '😄'][mood - 1] || '😐';
  const getMoodColor = (mood: number): string => ['#D32F2F', '#FF9800', '#FFC107', '#4CAF50', '#8BC34A'][mood - 1] || '#999';
  const handleDateChange = (days: number) => setSelectedDate(current => {
    const next = new Date(current);
    next.setDate(next.getDate() + days);
    return next;
  });
  const openNewEntry = (mood?: number) => navigation.navigate('DiaryEditor', {
    date: selectedDate.toISOString(),
    ...(mood ? { mood } : {}),
  });
  const handleDeleteEntry = (entryId: string) => Alert.alert('Delete Entry', 'Are you sure you want to delete this diary entry?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      const updatedEntries = entries.filter(entry => entry.id !== entryId);
      try {
        await saveDiaryEntries(updatedEntries);
        setEntries(updatedEntries);
      } catch (error) {
        console.error('Failed to delete diary entry:', error);
        Alert.alert('Error', 'Could not delete this diary entry.');
      }
    } },
  ]);

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}><Text style={styles.title}>Daily Diary</Text><Text style={styles.subtitle}>{formatDate(selectedDate)}</Text></View>
        <View style={styles.dateNavigator}>
          <TouchableOpacity style={styles.dateButton} onPress={() => handleDateChange(-1)}><Text style={styles.dateButtonText}>← Previous</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.dateButton, styles.todayButton]} onPress={() => setSelectedDate(new Date())}><Text style={[styles.dateButtonText, styles.todayButtonText]}>Today</Text></TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={() => handleDateChange(1)}><Text style={styles.dateButtonText}>Next →</Text></TouchableOpacity>
        </View>
        <View style={styles.moodSelector}>
          <Text style={styles.moodLabel}>How are you feeling today?</Text>
          <View style={styles.moodOptions}>{[1, 2, 3, 4, 5].map(mood => <TouchableOpacity key={mood} style={[styles.moodOption, { backgroundColor: getMoodColor(mood) }]} onPress={() => openNewEntry(mood)}><Text style={styles.moodEmoji}>{getMoodEmoji(mood)}</Text></TouchableOpacity>)}</View>
        </View>
        {allTags.length > 0 && <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by tag:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={[styles.tagButton, filterTag === null && styles.tagButtonActive]} onPress={() => setFilterTag(null)}><Text style={[styles.tagButtonText, filterTag === null && styles.tagButtonTextActive]}>All</Text></TouchableOpacity>
            {allTags.map(tag => <TouchableOpacity key={tag} style={[styles.tagButton, filterTag === tag && styles.tagButtonActive]} onPress={() => setFilterTag(tag)}><Text style={[styles.tagButtonText, filterTag === tag && styles.tagButtonTextActive]}>{tag}</Text></TouchableOpacity>)}
          </ScrollView>
        </View>}
        <View style={styles.entriesContainer}>
          {visibleEntries.length === 0 ? <View style={styles.emptyContainer}><Text style={styles.emptyText}>No diary entries for this date</Text><Text style={styles.emptySubtext}>Tap the button below to add your first entry</Text></View> : visibleEntries.map(entry => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.entryMood}><Text style={styles.entryMoodEmoji}>{getMoodEmoji(entry.mood)}</Text></View>
                <View style={styles.entryMeta}><Text style={styles.entryTime}>{toDate(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>{entry.tags.length > 0 && <View style={styles.entryTags}>{entry.tags.map((tag, index) => <Text key={`${entry.id}-${tag}-${index}`} style={styles.entryTag}>#{tag}</Text>)}</View>}</View>
                <TouchableOpacity style={styles.entryActions} onPress={() => handleDeleteEntry(entry.id)}><Text style={styles.entryActionText}>Delete</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.entryContent} onPress={() => navigation.navigate('DiaryEditor', { entryId: entry.id })}><Text style={styles.entryText} numberOfLines={3}>{entry.content || 'No content'}</Text></TouchableOpacity>
              {entry.reflections.length > 0 && <View style={styles.entryReflections}><Text style={styles.reflectionsTitle}>Reflections:</Text>{entry.reflections.slice(0, 2).map((reflection, index) => <Text key={`${entry.id}-reflection-${index}`} style={styles.reflectionText}>• {reflection}</Text>)}{entry.reflections.length > 2 && <Text style={styles.moreReflections}>+{entry.reflections.length - 2} more</Text>}</View>}
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => openNewEntry()}><Text style={styles.addButtonText}>+ Add Diary Entry</Text></TouchableOpacity>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}><Text style={styles.statValue}>{entries.length}</Text><Text style={styles.statLabel}>Total Entries</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{entries.length ? Math.round(entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length) : 0}</Text><Text style={styles.statLabel}>Avg Mood</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{allTags.length}</Text><Text style={styles.statLabel}>Unique Tags</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' }, scrollContainer: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { fontSize: 18, color: '#666' },
  header: { marginBottom: 20, alignItems: 'center' }, title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 }, subtitle: { fontSize: 14, color: '#666' },
  dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }, dateButton: { padding: 10 }, dateButtonText: { fontSize: 14, color: '#6200EE', fontWeight: '500' }, todayButton: { backgroundColor: '#6200EE', borderRadius: 8 }, todayButtonText: { color: 'white' },
  moodSelector: { backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }, moodLabel: { fontSize: 14, color: '#666', marginBottom: 15, textAlign: 'center' }, moodOptions: { flexDirection: 'row', justifyContent: 'space-between' }, moodOption: { width: width / 5 - 20, aspectRatio: 1, borderRadius: 50, justifyContent: 'center', alignItems: 'center' }, moodEmoji: { fontSize: 24 },
  filterContainer: { marginBottom: 20 }, filterLabel: { fontSize: 14, color: '#666', marginBottom: 10 }, tagButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CCC', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10, marginBottom: 10 }, tagButtonActive: { backgroundColor: '#6200EE', borderColor: '#6200EE' }, tagButtonText: { fontSize: 12, color: '#666' }, tagButtonTextActive: { color: 'white' },
  entriesContainer: { marginBottom: 20 }, emptyContainer: { alignItems: 'center', padding: 40, backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }, emptyText: { fontSize: 16, color: '#666', marginBottom: 10 }, emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center' },
  entryCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }, entryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, entryMood: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 10 }, entryMoodEmoji: { fontSize: 20 }, entryMeta: { flex: 1 }, entryTime: { fontSize: 12, color: '#888', marginBottom: 5 }, entryTags: { flexDirection: 'row', flexWrap: 'wrap' }, entryTag: { fontSize: 10, color: '#6200EE', marginRight: 5 }, entryActions: { alignSelf: 'flex-start' }, entryActionText: { fontSize: 12, color: '#D32F2F', fontWeight: '500' }, entryContent: { marginBottom: 10 }, entryText: { fontSize: 14, color: '#333', lineHeight: 20 }, entryReflections: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E0E0E0' }, reflectionsTitle: { fontSize: 12, color: '#888', marginBottom: 5 }, reflectionText: { fontSize: 12, color: '#666', lineHeight: 16, marginBottom: 3 }, moreReflections: { fontSize: 10, color: '#999', marginTop: 3 },
  addButton: { backgroundColor: '#6200EE', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 }, addButtonText: { fontSize: 16, color: 'white', fontWeight: '600' }, statsContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }, statItem: { alignItems: 'center' }, statValue: { fontSize: 20, fontWeight: 'bold', color: '#6200EE' }, statLabel: { fontSize: 12, color: '#888', marginTop: 5 },
});

export default DiaryScreen;
