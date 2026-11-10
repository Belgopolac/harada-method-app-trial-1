import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  HARADA_GRIDS: '@harada_grids',
  ACTIVE_GRID_ID: '@active_grid_id',
  DAILY_ROUTINES: '@daily_routines',
  DIARY_ENTRIES: '@diary_entries',
  CALENDAR_EVENTS: '@calendar_events',
  SETTINGS: '@settings',
};

export const getItem = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting item:', error);
    return null;
  }
};

export const setItem = async <T>(key: string, value: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting item:', error);
    throw error;
  }
};

export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing item:', error);
    throw error;
  }
};

export const getHaradaGrids = async (): Promise<any[]> => {
  return (await getItem<any[]>(STORAGE_KEYS.HARADA_GRIDS)) ?? [];
};

export const saveHaradaGrids = async (grids: any[]): Promise<void> => {
  await setItem<any[]>(STORAGE_KEYS.HARADA_GRIDS, grids);
};

export const getActiveGridId = async (): Promise<string | null> => {
  return getItem<string>(STORAGE_KEYS.ACTIVE_GRID_ID);
};

export const setActiveGridId = async (gridId: string): Promise<void> => {
  await setItem<string>(STORAGE_KEYS.ACTIVE_GRID_ID, gridId);
};

export const getDailyRoutines = async (): Promise<any[]> => {
  return (await getItem<any[]>(STORAGE_KEYS.DAILY_ROUTINES)) ?? [];
};

export const saveDailyRoutines = async (routines: any[]): Promise<void> => {
  await setItem<any[]>(STORAGE_KEYS.DAILY_ROUTINES, routines);
};

export const getDiaryEntries = async (): Promise<any[]> => {
  return (await getItem<any[]>(STORAGE_KEYS.DIARY_ENTRIES)) ?? [];
};

export const saveDiaryEntries = async (entries: any[]): Promise<void> => {
  await setItem<any[]>(STORAGE_KEYS.DIARY_ENTRIES, entries);
};

export const getCalendarEvents = async (): Promise<any[]> => {
  return (await getItem<any[]>(STORAGE_KEYS.CALENDAR_EVENTS)) ?? [];
};

export const saveCalendarEvents = async (events: any[]): Promise<void> => {
  await setItem<any[]>(STORAGE_KEYS.CALENDAR_EVENTS, events);
};

export const getSettings = async (): Promise<any> => {
  return (await getItem<any>(STORAGE_KEYS.SETTINGS)) ?? {};
};

export const saveSettings = async (settings: any): Promise<void> => {
  await setItem<any>(STORAGE_KEYS.SETTINGS, settings);
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

export default STORAGE_KEYS;
