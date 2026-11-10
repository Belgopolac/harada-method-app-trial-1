import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, DiaryEntry } from '../types';
import { getDiaryEntries, saveDiaryEntries } from '../utils/storage';
import { formatDate } from '../utils/harada';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Diary'>;
const { width } = Dimensions.get('window');

const DiaryScreen = () => {
  const navigation = useNavigation<Navigation>();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterTag, setFilterTag] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getDiaryEntries().then((items: any[]) => {
      if (mounted) setEntries(items.map(item => ({ ...item, date: new Date(item.date), createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) })));
    }).catch(error => console.error('Failed to load diary entries:', error)).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => { if (!loading) saveDiaryEntries(entries).catch(error => console.error('Failed to save diary entries:', error)); }, [entries, loading]);

  const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dayEntries = entries.filter(entry => dateKey(new Date(entry.date)) === dateKey(selectedDate));
  const tags = Array.from(new Set(entries.flatMap(entry => entry.tags))).sort();
  const visibleEntries = (filterTag ? dayEntries.filter(entry => entry.tags.includes(filterTag)) : dayEntries).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const moodEmoji = (mood: number) => ['😔', '😐', '😬', '😊', '😄'][mood - 1] || '😐';
  const addEntry = (mood = 3) => {
    const entry: DiaryEntry = { id: `${Date.now()}`, date: selectedDate, content: '', reflections: [], mood, tags: [], createdAt: new Date(), updatedAt: new Date() };
    setEntries(current => [...current, entry]);
    navigation.navigate('DiaryEditor', { entryId: entry.id });
  };
  const deleteEntry = (entryId: string) => Alert.alert('Delete Entry', 'Delete this diary entry?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => setEntries(current => current.filter(entry => entry.id !== entryId)) },
  ]);
  const moveDate = (days: number) => setSelectedDate(current => { const date = new Date(current); date.setDate(date.getDate() + days); return date; });

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><Text style={styles.muted}>Loading diary…</Text></View></SafeAreaView>;
  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Text style={styles.title}>Daily Diary</Text><Text style={styles.muted}>{formatDate(selectedDate)}</Text></View>
    <View style={styles.row}><TouchableOpacity onPress={() => moveDate(-1)}><Text style={styles.link}>← Previous</Text></TouchableOpacity><TouchableOpacity onPress={() => setSelectedDate(new Date())}><Text style={styles.link}>Today</Text></TouchableOpacity><TouchableOpacity onPress={() => moveDate(1)}><Text style={styles.link}>Next →</Text></TouchableOpacity></View>
    <View style={styles.card}><Text style={styles.label}>How are you feeling today?</Text><View style={styles.row}>{[1, 2, 3, 4, 5].map(mood => <TouchableOpacity key={mood} style={[styles.mood, { backgroundColor: ['#D32F2F', '#FF9800', '#FFC107', '#4CAF50', '#8BC34A'][mood - 1], width: width / 6 }]} onPress={() => addEntry(mood)}><Text style={styles.emoji}>{moodEmoji(mood)}</Text></TouchableOpacity>)}</View></View>
    {tags.length > 0 && <View style={styles.row}><TouchableOpacity style={[styles.tag, !filterTag && styles.selectedTag]} onPress={() => setFilterTag(null)}><Text style={!filterTag ? styles.selectedText : styles.tagText}>All</Text></TouchableOpacity><ScrollView horizontal>{tags.map(tag => <TouchableOpacity key={tag} style={[styles.tag, filterTag === tag && styles.selectedTag]} onPress={() => setFilterTag(tag)}><Text style={filterTag === tag ? styles.selectedText : styles.tagText}>#{tag}</Text></TouchableOpacity>)}</ScrollView></View>}
    {visibleEntries.length === 0 ? <View style={styles.card}><Text style={styles.muted}>No diary entries for this date.</Text></View> : visibleEntries.map(entry => <View key={entry.id} style={styles.card}>
      <View style={styles.row}><Text style={styles.emoji}>{moodEmoji(entry.mood)}</Text><Text style={[styles.muted, { flex: 1 }]}>{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {entry.tags.map(tag => `#${tag}`).join(' ')}</Text><TouchableOpacity onPress={() => deleteEntry(entry.id)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity></View>
      <TouchableOpacity onPress={() => navigation.navigate('DiaryEditor', { entryId: entry.id })}><Text style={styles.entryText}>{entry.content || 'Tap to add content'}</Text>{entry.reflections.map((reflection, index) => <Text style={styles.muted} key={`${entry.id}-reflection-${index}`}>• {reflection}</Text>)}</TouchableOpacity>
    </View>)}
    <TouchableOpacity style={styles.addButton} onPress={() => addEntry()}><Text style={styles.addText}>+ Add Diary Entry</Text></TouchableOpacity>
    <View style={styles.row}><Text style={styles.muted}>Entries: {entries.length}</Text><Text style={styles.muted}>Tags: {tags.length}</Text><Text style={styles.muted}>Avg mood: {entries.length ? (entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length).toFixed(1) : '—'}</Text></View>
  </ScrollView></SafeAreaView>;
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F5F5F5' }, content: { padding: 20, paddingBottom: 40 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, header: { alignItems: 'center', marginBottom: 18 }, title: { fontSize: 24, fontWeight: 'bold', color: '#333' }, muted: { color: '#777', fontSize: 13 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }, card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 14, elevation: 2 }, label: { textAlign: 'center', color: '#555', marginBottom: 14 }, mood: { aspectRatio: 1, borderRadius: 99, alignItems: 'center', justifyContent: 'center' }, emoji: { fontSize: 21 }, link: { color: '#6200EE', fontWeight: '600' }, tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#CCC', marginRight: 7 }, selectedTag: { backgroundColor: '#6200EE', borderColor: '#6200EE' }, tagText: { color: '#666', fontSize: 12 }, selectedText: { color: 'white', fontSize: 12 }, entryText: { color: '#333', lineHeight: 21, marginTop: 10 }, deleteText: { color: '#D32F2F' }, addButton: { backgroundColor: '#6200EE', padding: 16, borderRadius: 10, alignItems: 'center' }, addText: { color: 'white', fontWeight: '600' },
});

export default DiaryScreen;
