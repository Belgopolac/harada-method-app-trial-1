import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { DiaryEntry, RootStackParamList } from '../types';
import { getDiaryEntries, saveDiaryEntries } from '../utils/storage';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'DiaryEditor'>;
type DiaryEditorRoute = RouteProp<RootStackParamList, 'DiaryEditor'>;

const DiaryEditorScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { entryId, date } = useRoute<DiaryEditorRoute>().params ?? {};
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [content, setContent] = useState('');
  const [reflectionsText, setReflectionsText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [mood, setMood] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getDiaryEntries().then((items: any[]) => {
      const existing = entryId ? items.find(item => item.id === entryId) : undefined;
      if (!mounted) return;
      if (existing) {
        const normalized = { ...existing, date: new Date(existing.date), createdAt: new Date(existing.createdAt), updatedAt: new Date(existing.updatedAt) } as DiaryEntry;
        setEntry(normalized);
        setContent(normalized.content ?? '');
        setReflectionsText((normalized.reflections ?? []).join('\n'));
        setTagsText((normalized.tags ?? []).join(', '));
        setMood(normalized.mood || 3);
      } else {
        const now = new Date();
        setEntry({ id: entryId ?? `${Date.now()}`, date: date ? new Date(date) : now, content: '', reflections: [], mood: 3, tags: [], createdAt: now, updatedAt: now });
      }
    }).catch(error => Alert.alert('Error', `Could not load diary entry: ${String(error)}`)).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [date, entryId]);

  const save = async () => {
    if (!entry) return;
    const updated: DiaryEntry = {
      ...entry,
      content: content.trim(),
      reflections: reflectionsText.split('\n').map(item => item.trim()).filter(Boolean),
      tags: tagsText.split(',').map(item => item.trim().replace(/^#/, '')).filter(Boolean),
      mood,
      updatedAt: new Date(),
    };
    try {
      const allEntries: any[] = await getDiaryEntries();
      const index = allEntries.findIndex(item => item.id === updated.id);
      if (index < 0) allEntries.push(updated);
      else allEntries[index] = updated;
      await saveDiaryEntries(allEntries);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Save failed', `Could not save this entry: ${String(error)}`);
    }
  };

  if (loading || !entry) return <SafeAreaView style={styles.container}><Text style={styles.loading}>Loading entry…</Text></SafeAreaView>;
  return <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>How are you feeling?</Text>
        <View style={styles.moods}>{['😔', '😐', '😬', '😊', '😄'].map((emoji, index) => <TouchableOpacity key={emoji} style={[styles.mood, mood === index + 1 && styles.moodSelected]} onPress={() => setMood(index + 1)}><Text style={styles.emoji}>{emoji}</Text></TouchableOpacity>)}</View>
        <Text style={styles.label}>Entry</Text>
        <TextInput value={content} onChangeText={setContent} placeholder="Write about your day…" multiline style={[styles.input, styles.contentInput]} textAlignVertical="top" />
        <Text style={styles.label}>Reflections (one per line)</Text>
        <TextInput value={reflectionsText} onChangeText={setReflectionsText} placeholder="What did you learn?" multiline style={[styles.input, styles.secondaryInput]} textAlignVertical="top" />
        <Text style={styles.label}>Tags (comma separated)</Text>
        <TextInput value={tagsText} onChangeText={setTagsText} placeholder="progress, gratitude" style={styles.input} autoCapitalize="none" />
        <TouchableOpacity style={styles.saveButton} onPress={save}><Text style={styles.saveText}>Save Entry</Text></TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F5F5F5' }, flex: { flex: 1 }, content: { padding: 20, paddingBottom: 40 }, loading: { margin: 24, textAlign: 'center', color: '#666' }, label: { color: '#333', fontWeight: '600', marginBottom: 8, marginTop: 16 }, moods: { flexDirection: 'row', justifyContent: 'space-between' }, mood: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#DDD' }, moodSelected: { borderWidth: 3, borderColor: '#6200EE' }, emoji: { fontSize: 24 }, input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, color: '#333', fontSize: 16 }, contentInput: { minHeight: 180 }, secondaryInput: { minHeight: 90 }, saveButton: { backgroundColor: '#6200EE', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 }, saveText: { color: 'white', fontWeight: '600', fontSize: 16 }, cancelButton: { padding: 15, alignItems: 'center' }, cancelText: { color: '#666', fontWeight: '600' },
});

export default DiaryEditorScreen;
