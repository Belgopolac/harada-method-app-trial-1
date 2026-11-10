import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, Switch, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getSettings, saveSettings, clearAllData } from '../utils/storage';
import { useCalendar } from '../hooks/useCalendar';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Settings'>;
interface AppSettings { notificationsEnabled: boolean; darkMode: boolean; autoSyncCalendar: boolean; showTutorial: boolean }
const defaults: AppSettings = { notificationsEnabled: true, darkMode: false, autoSyncCalendar: false, showTutorial: true };

const SettingsScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { permissionsGranted, requestPermissions, syncWithNativeCalendar } = useCalendar();
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getSettings().then(value => setSettings({ ...defaults, ...value })).catch(error => console.error('Failed to load settings:', error)).finally(() => setLoading(false)); }, []);
  useEffect(() => { if (!loading) saveSettings(settings).catch(error => console.error('Failed to save settings:', error)); }, [settings, loading]);
  const toggle = (key: keyof AppSettings) => setSettings(current => ({ ...current, [key]: !current[key] }));
  const syncCalendar = async () => {
    if (!permissionsGranted) { Alert.alert('Permission needed', 'Grant calendar permission before syncing.'); return; }
    Alert.alert('Calendar', `${await syncWithNativeCalendar()} events synced.`);
  };
  const reset = () => Alert.alert('Reset All Data', 'Delete all grids, diary entries, settings, and calendar events?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Reset', style: 'destructive', onPress: async () => { try { await clearAllData(); setSettings(defaults); Alert.alert('Reset complete', 'App data has been cleared.'); navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); } catch { Alert.alert('Error', 'Could not reset app data.'); } } },
  ]);
  const settingRow = (title: string, description: string, key: keyof AppSettings) => <View style={styles.setting} key={key}><View style={styles.settingInfo}><Text style={styles.settingTitle}>{title}</Text><Text style={styles.description}>{description}</Text></View><Switch value={settings[key]} onValueChange={() => toggle(key)} trackColor={{ false: '#CCC', true: '#6200EE' }} /></View>;
  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><Text style={styles.description}>Loading settings…</Text></View></SafeAreaView>;
  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Settings</Text>
    <Text style={styles.sectionTitle}>App Settings</Text>
    {settingRow('Dark Mode', 'Enable dark mode for the app', 'darkMode')}
    {settingRow('Notifications', 'Receive daily reminders for your goals', 'notificationsEnabled')}
    {settingRow('Auto Sync Calendar', 'Automatically sync Harada events with your device calendar', 'autoSyncCalendar')}
    {settingRow('Show Tutorial', 'Show tutorial tips for new users', 'showTutorial')}
    <Text style={styles.sectionTitle}>Calendar</Text>
    <View style={styles.setting}><View style={styles.settingInfo}><Text style={styles.settingTitle}>{permissionsGranted ? 'Calendar permission granted' : 'Calendar permission not granted'}</Text><Text style={styles.description}>Permission is needed to access device calendar events.</Text></View>{!permissionsGranted && <TouchableOpacity style={styles.smallButton} onPress={async () => { const granted = await requestPermissions(); Alert.alert(granted ? 'Granted' : 'Not granted', granted ? 'Calendar permission granted.' : 'Calendar permission was not granted.'); }}><Text style={styles.whiteText}>Grant</Text></TouchableOpacity>}</View>
    {permissionsGranted && <TouchableOpacity style={styles.button} onPress={syncCalendar}><Text style={styles.whiteText}>Sync with Device Calendar</Text></TouchableOpacity>}
    <Text style={styles.sectionTitle}>Data</Text><TouchableOpacity style={[styles.setting, styles.dangerRow]} onPress={reset}><View><Text style={[styles.settingTitle, { color: '#D32F2F' }]}>Reset All Data</Text><Text style={styles.description}>Delete your grids, diary entries, and calendar events.</Text></View></TouchableOpacity>
    <Text style={styles.sectionTitle}>About</Text><View style={styles.setting}><Text style={styles.description}>App version</Text><Text style={styles.settingTitle}>1.0.0</Text></View><View style={styles.setting}><Text style={styles.description}>Harada Method</Text><Text style={styles.description}>Goal-achievement framework</Text></View>
    <TouchableOpacity style={styles.setting} onPress={() => Linking.openURL('mailto:feedback@haradamethod.app?subject=App%20Feedback')}><Text style={styles.link}>Send Feedback</Text></TouchableOpacity><TouchableOpacity style={styles.setting} onPress={() => Alert.alert('Rate the App', 'App store listing is not configured yet.')}><Text style={styles.link}>Rate the App</Text></TouchableOpacity>
    <Text style={styles.footer}>Made with ❤️ for goal achievers</Text>
  </ScrollView></SafeAreaView>;
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F5F5F5' }, content: { padding: 20, paddingBottom: 40 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 22 }, sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 18, marginBottom: 10 }, setting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2, gap: 10 }, settingInfo: { flex: 1 }, settingTitle: { fontWeight: '600', color: '#333', marginBottom: 4 }, description: { fontSize: 12, color: '#666' }, smallButton: { backgroundColor: '#6200EE', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 }, button: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 }, whiteText: { color: 'white', fontWeight: '600' }, dangerRow: { borderLeftWidth: 4, borderLeftColor: '#D32F2F' }, link: { color: '#6200EE', fontWeight: '600' }, footer: { textAlign: 'center', color: '#888', fontSize: 12, marginTop: 20 },
});

export default SettingsScreen;
