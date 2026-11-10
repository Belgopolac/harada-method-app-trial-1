import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Dimensions, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, DiaryEntry } from '../types';
import { getDiaryEntries, saveDiaryEntries } from '../utils/storage';
import { formatDate } from '../utils/harada';

type DiaryEditorNavigation = NativeStackNavigationProp<RootStackParamList, 'DiaryEditor'>;
type DiaryEditorRoute = RouteProp<RootStackParamList, 'DiaryEditor'>;
const { width } = Dimensions.get('window');
const asValidDate = (value?: string): Date => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const DiaryEditorScreen = () => {
  const navigation = useNavigation<DiaryEditorNavigation>();
  const route = useRoute<DiaryEditorRoute>();
  const { entryId, date: routeDate, mood: routeMood } = route.params ?? {};
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date>(() => asValidDate(routeDate));
  const [content, setContent] = useState('');
  const [reflections, setReflections] = useState<string[]>([]);
  const [currentReflection, setCurrentReflection] = useState('');
  const [mood, setMood] = useState(routeMood ?? 3);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadEntries = async () => {
      try {
        const loaded = await getDiaryEntries();
        const normalized: DiaryEntry[] = loaded.map((item: any) => ({
          ...item,
          date: asValidDate(item.date).toISOString(),
          createdAt: asValidDate(item.createdAt).toISOString(),
          updatedAt: asValidDate(item.updatedAt).toISOString(),
          reflections: Array.isArray(item.reflections) ? item.reflections : [],
          tags: Array.isArray(item.tags) ? item.tags : [],
          mood: Number(item.mood) || 3,
        }));
        if (!mounted) return;
        setEntries(normalized);
        if (entryId) {
          const existing = normalized.find(entry => entry.id === entryId);
          if (existing) {
            setDate(asValidDate(existing.date));
            setContent(existing.content || '');
            setReflections(existing.reflections);
            setMood(existing.mood);
            setTags(existing.tags);
          }
        }
      } catch (error) {
        console.error('Failed to load diary entries:', error);
        Alert.alert('Diary', 'Could not load diary entries.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadEntries();
    return () => { mounted = false; };
  }, [entryId]);

  const handleSave = async () => {
    const existing = entryId ? entries.find(entry => entry.id === entryId) : undefined;
    const now = new Date().toISOString();
    const entry: DiaryEntry = {
      id: entryId || `${Date.now()}`,
      date: date.toISOString(),
      content: content.trim(),
      reflections: reflections.map(item => item.trim()).filter(Boolean),
      mood,
      tags: tags.map(tag => tag.trim().toLowerCase()).filter(Boolean),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    const updatedEntries = entryId
      ? entries.map(item => item.id === entryId ? entry : item)
      : [...entries, entry];
    try {
      await saveDiaryEntries(updatedEntries);
      setEntries(updatedEntries);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save diary entry:', error);
      Alert.alert('Save failed', 'Could not save this diary entry. Please try again.');
    }
  };

  const handleAddReflection = () => {
    const value = currentReflection.trim();
    if (!value) return;
    setReflections(current => [...current, value]);
    setCurrentReflection('');
  };
  const handleAddTag = () => {
    const value = currentTag.trim().toLowerCase().replace(/^#/, '');
    if (!value) return;
    setTags(current => current.includes(value) ? current : [...current, value]);
    setCurrentTag('');
  };
  const moodEmoji = (value: number): string => ['😔', '😐', '😬', '😊', '😄'][value - 1] || '😐';
  const moodColor = (value: number): string => ['#D32F2F', '#FF9800', '#FFC107', '#4CAF50', '#8BC34A'][value - 1] || '#999';

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading...</Text></View></SafeAreaView>;
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoiding}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.header}><Text style={styles.title}>{entryId ? 'Edit Diary Entry' : 'New Diary Entry'}</Text><Text style={styles.dateText}>{formatDate(date)}</Text></View>
          <View style={styles.moodSelector}><Text style={styles.moodLabel}>How are you feeling?</Text><View style={styles.moodOptions}>{[1, 2, 3, 4, 5].map(value => <TouchableOpacity key={value} style={[styles.moodOption, mood === value && { backgroundColor: moodColor(value) }]} onPress={() => setMood(value)}><Text style={styles.moodEmoji}>{moodEmoji(value)}</Text>{mood === value && <View style={styles.moodSelectionIndicator} />}</TouchableOpacity>)}</View></View>
          <View style={styles.inputGroup}><Text style={styles.label}>What's on your mind?</Text><TextInput style={[styles.input, styles.largeInput]} value={content} onChangeText={setContent} placeholder="Write about your day, thoughts, or progress towards your goals..." placeholderTextColor="#999" multiline numberOfLines={6} textAlignVertical="top" /></View>
          <View style={styles.inputGroup}><Text style={styles.label}>Reflections</Text><View style={styles.reflectionInputContainer}><TextInput style={[styles.input, styles.reflectionInput]} value={currentReflection} onChangeText={setCurrentReflection} placeholder="Add a reflection..." placeholderTextColor="#999" onSubmitEditing={handleAddReflection} blurOnSubmit /><TouchableOpacity style={styles.addReflectionButton} onPress={handleAddReflection}><Text style={styles.addReflectionButtonText}>+</Text></TouchableOpacity></View><View style={styles.reflectionsList}>{reflections.map((reflection, index) => <View key={`${index}-${reflection}`} style={styles.reflectionItem}><Text style={styles.reflectionText}>{reflection}</Text><TouchableOpacity style={styles.removeReflectionButton} onPress={() => setReflections(current => current.filter((_, i) => i !== index))}><Text style={styles.removeReflectionButtonText}>×</Text></TouchableOpacity></View>)}</View></View>
          <View style={styles.inputGroup}><Text style={styles.label}>Tags (Optional)</Text><View style={styles.tagInputContainer}><TextInput style={[styles.input, styles.tagInput]} value={currentTag} onChangeText={setCurrentTag} placeholder="Add a tag..." placeholderTextColor="#999" onSubmitEditing={handleAddTag} blurOnSubmit autoCapitalize="none" /><TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}><Text style={styles.addTagButtonText}>+</Text></TouchableOpacity></View><View style={styles.tagsList}>{tags.map(tag => <View key={tag} style={styles.tagItem}><Text style={styles.tagText}>#{tag}</Text><TouchableOpacity style={styles.removeTagButton} onPress={() => setTags(current => current.filter(item => item !== tag))}><Text style={styles.removeTagButtonText}>×</Text></TouchableOpacity></View>)}</View></View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}><Text style={styles.saveButtonText}>Save Entry</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, styles.cancelButton]} onPress={() => navigation.goBack()}><Text style={[styles.saveButtonText, styles.cancelButtonText]}>Cancel</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' }, keyboardAvoiding: { flex: 1 }, scrollContainer: { padding: 20, paddingBottom: 40 }, loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }, loadingText: { fontSize: 18, color: '#666' }, header: { marginBottom: 20, alignItems: 'center' }, title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 }, dateText: { fontSize: 14, color: '#666' }, moodSelector: { backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20, elevation: 2 }, moodLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 15, textAlign: 'center' }, moodOptions: { flexDirection: 'row', justifyContent: 'space-between' }, moodOption: { width: width / 5 - 20, aspectRatio: 1, borderRadius: 50, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' }, moodEmoji: { fontSize: 24 }, moodSelectionIndicator: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: 'white', bottom: 4 }, inputGroup: { marginBottom: 20 }, label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 }, input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, fontSize: 16, color: '#333' }, largeInput: { minHeight: 120, textAlignVertical: 'top' }, reflectionInputContainer: { flexDirection: 'row', alignItems: 'center' }, reflectionInput: { flex: 1, marginRight: 10 }, addReflectionButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6200EE', justifyContent: 'center', alignItems: 'center' }, addReflectionButtonText: { fontSize: 20, color: 'white', fontWeight: 'bold' }, reflectionsList: { marginTop: 10 }, reflectionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 8, padding: 10, marginBottom: 8 }, reflectionText: { fontSize: 14, color: '#333', flex: 1 }, removeReflectionButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginLeft: 10 }, removeReflectionButtonText: { fontSize: 16, color: '#D32F2F', fontWeight: 'bold' }, tagInputContainer: { flexDirection: 'row', alignItems: 'center' }, tagInput: { flex: 1, marginRight: 10 }, addTagButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6200EE', justifyContent: 'center', alignItems: 'center' }, addTagButtonText: { fontSize: 20, color: 'white', fontWeight: 'bold' }, tagsList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }, tagItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10, marginBottom: 10 }, tagText: { fontSize: 12, color: '#1976D2', marginRight: 5 }, removeTagButton: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' }, removeTagButtonText: { fontSize: 14, color: '#D32F2F', fontWeight: 'bold' }, saveButton: { backgroundColor: '#6200EE', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 15, elevation: 3 }, saveButtonText: { fontSize: 16, color: 'white', fontWeight: '600' }, cancelButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CCC' }, cancelButtonText: { color: '#666' },
});

export default DiaryEditorScreen;
