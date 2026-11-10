import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  HARADA_GRIDS: '@harada_grids',
  ACTIVE_GRID_ID: '@active_grid_id',
  DAILY_ROUTINES: '@daily_routines',
  CALENDAR_EVENTS: '@calendar_events',
  DIARY_ENTRIES: '@diary_entries',
  SETTINGS: '@app_settings',
  LEGACY_SETTINGS: '@settings',
};

const serializeForStorage = (value: any): any => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeForStorage);
  if (value && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) result[key] = serializeForStorage(value[key]);
    return result;
  }
  return value;
};

const deserializeFromStorage = (value: any): any => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? value : parsedDate;
  }
  if (Array.isArray(value)) return value.map(deserializeFromStorage);
  if (value && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) result[key] = deserializeFromStorage(value[key]);
    return result;
  }
  return value;
};

export const getItem = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data === null ? null : deserializeFromStorage(JSON.parse(data)) as T;
  } catch (error) {
    console.error(`Failed to load stored item (${key}):`, error);
    throw error;
  }
};

export const setItem = async <T>(key: string, value: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(serializeForStorage(value)));
  } catch (error) {
    console.error(`Failed to save stored item (${key}):`, error);
    throw error;
  }
};

export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove stored item (${key}):`, error);
    throw error;
  }
};

export const getHaradaGrids = async (): Promise<any[]> => (await getItem<any[]>(STORAGE_KEYS.HARADA_GRIDS)) ?? [];
export const saveHaradaGrids = async (grids: any[]): Promise<void> => setItem(STORAGE_KEYS.HARADA_GRIDS, grids);

export const getActiveGridId = async (): Promise<string | null> => getItem<string>(STORAGE_KEYS.ACTIVE_GRID_ID);
export const setActiveGridId = async (gridId: string | null): Promise<void> => {
  if (gridId === null) return removeItem(STORAGE_KEYS.ACTIVE_GRID_ID);
  return setItem(STORAGE_KEYS.ACTIVE_GRID_ID, gridId);
};

export const getDailyRoutines = async (): Promise<any[]> => (await getItem<any[]>(STORAGE_KEYS.DAILY_ROUTINES)) ?? [];
export const saveDailyRoutines = async (routines: any[]): Promise<void> => setItem(STORAGE_KEYS.DAILY_ROUTINES, routines);

export const getCalendarEvents = async (): Promise<any[]> => (await getItem<any[]>(STORAGE_KEYS.CALENDAR_EVENTS)) ?? [];
export const saveCalendarEvents = async (events: any[]): Promise<void> => setItem(STORAGE_KEYS.CALENDAR_EVENTS, events);

export const getDiaryEntries = async (): Promise<any[]> => (await getItem<any[]>(STORAGE_KEYS.DIARY_ENTRIES)) ?? [];
export const saveDiaryEntries = async (entries: any[]): Promise<void> => setItem(STORAGE_KEYS.DIARY_ENTRIES, entries);

const DEFAULT_SETTINGS = {
  notificationsEnabled: true,
  darkMode: false,
  autoSyncCalendar: false,
  showTutorial: true,
};

export const getSettings = async (): Promise<any> => {
  const current = await getItem<any>(STORAGE_KEYS.SETTINGS);
  if (current !== null) return { ...DEFAULT_SETTINGS, ...current };

  // Migrate settings saved by earlier versions under @settings.
  const legacy = await getItem<any>(STORAGE_KEYS.LEGACY_SETTINGS);
  if (legacy !== null) {
    await setItem(STORAGE_KEYS.SETTINGS, legacy);
    await removeItem(STORAGE_KEYS.LEGACY_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...legacy };
  }
  return { ...DEFAULT_SETTINGS };
};

export const saveSettings = async (settings: any): Promise<void> => setItem(STORAGE_KEYS.SETTINGS, settings);

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Failed to clear app data:', error);
    throw error;
  }
};

export default STORAGE_KEYS;
