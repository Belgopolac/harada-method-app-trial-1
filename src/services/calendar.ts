import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { CalendarEvent } from '../types';
import { getCalendarEvents as readStoredEvents, saveCalendarEvents } from '../utils/storage';
import { generateId } from '../utils/harada';

interface NativeCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: number;
  endDate: number;
  isHaradaEvent: boolean;
}

interface NativeCalendarModule {
  checkPermissions(): Promise<boolean>;
  addEvent(title: string, startDate: number, endDate: number, description: string): Promise<string>;
  updateEvent(eventId: string, title: string, startDate: number, endDate: number, description: string): Promise<boolean>;
  deleteEvent(eventId: string): Promise<boolean>;
  getEventsForDate(date: number): Promise<NativeCalendarEvent[]>;
}

const NativeCalendar = NativeModules.CalendarModule as NativeCalendarModule | undefined;
const READ_CALENDAR = PermissionsAndroid.PERMISSIONS.READ_CALENDAR;
const WRITE_CALENDAR = PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR;

const asDate = (value: Date | string | number): Date => value instanceof Date ? value : new Date(value);

export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  const events = await readStoredEvents();
  return events.map(event => ({
    ...event,
    startDate: asDate(event.startDate),
    endDate: asDate(event.endDate),
  }));
};

export const checkCalendarPermissions = async (): Promise<{ granted: boolean; canRequest: boolean }> => {
  if (Platform.OS !== 'android' || !NativeCalendar) return { granted: false, canRequest: false };
  try {
    const [readGranted, writeGranted] = await Promise.all([
      PermissionsAndroid.check(READ_CALENDAR),
      PermissionsAndroid.check(WRITE_CALENDAR),
    ]);
    return { granted: readGranted && writeGranted, canRequest: true };
  } catch (error) {
    console.warn('Could not check calendar permissions:', error);
    return { granted: false, canRequest: true };
  }
};

export const requestCalendarPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !NativeCalendar) return false;
  const current = await checkCalendarPermissions();
  if (current.granted) return true;
  const results = await PermissionsAndroid.requestMultiple([READ_CALENDAR, WRITE_CALENDAR]);
  const granted = results[READ_CALENDAR] === PermissionsAndroid.RESULTS.GRANTED &&
    results[WRITE_CALENDAR] === PermissionsAndroid.RESULTS.GRANTED;
  return granted && NativeCalendar.checkPermissions();
};

export const addToNativeCalendar = async (event: CalendarEvent): Promise<string> => {
  if (!NativeCalendar) throw new Error('Native calendar module is unavailable on this platform.');
  const permissions = await checkCalendarPermissions();
  if (!permissions.granted) throw new Error('Calendar permissions have not been granted.');
  return NativeCalendar.addEvent(
    event.title,
    asDate(event.startDate).getTime(),
    asDate(event.endDate).getTime(),
    event.description ?? ''
  );
};

export const updateNativeCalendarEvent = async (event: CalendarEvent): Promise<boolean> => {
  if (!NativeCalendar || !event.nativeEventId) return false;
  return NativeCalendar.updateEvent(
    event.nativeEventId,
    event.title,
    asDate(event.startDate).getTime(),
    asDate(event.endDate).getTime(),
    event.description ?? ''
  );
};

export const deleteFromNativeCalendar = async (nativeEventId: string): Promise<boolean> => {
  if (!NativeCalendar) return false;
  return NativeCalendar.deleteEvent(nativeEventId);
};

export const addCalendarEvent = async (
  event: Omit<CalendarEvent, 'id' | 'isHaradaEvent' | 'nativeEventId'>
): Promise<CalendarEvent> => {
  const newEvent: CalendarEvent = { ...event, id: generateId(), isHaradaEvent: true };
  if (Platform.OS === 'android' && (await checkCalendarPermissions()).granted) {
    try {
      newEvent.nativeEventId = await addToNativeCalendar(newEvent);
    } catch (error) {
      console.warn('Saved event locally, but could not add it to the device calendar:', error);
    }
  }
  const events = await getCalendarEvents();
  await saveCalendarEvents([...events, newEvent]);
  return newEvent;
};

export const updateCalendarEvent = async (
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent | null> => {
  const events = await getCalendarEvents();
  const index = events.findIndex(event => event.id === eventId);
  if (index < 0) return null;
  const updatedEvent = { ...events[index], ...updates };
  if (updatedEvent.nativeEventId) {
    try {
      await updateNativeCalendarEvent(updatedEvent);
    } catch (error) {
      console.warn('Updated local event, but could not update device calendar:', error);
    }
  }
  events[index] = updatedEvent;
  await saveCalendarEvents(events);
  return updatedEvent;
};

export const deleteCalendarEvent = async (eventId: string): Promise<boolean> => {
  const events = await getCalendarEvents();
  const event = events.find(item => item.id === eventId);
  if (!event) return false;
  if (event.nativeEventId) {
    try {
      await deleteFromNativeCalendar(event.nativeEventId);
    } catch (error) {
      console.warn('Deleted local event, but could not delete device calendar event:', error);
    }
  }
  await saveCalendarEvents(events.filter(item => item.id !== eventId));
  return true;
};

export const getEventsForDate = async (date: Date): Promise<CalendarEvent[]> => {
  const dateKey = asDate(date).toDateString();
  const events = await getCalendarEvents();
  return events.filter(event => asDate(event.startDate).toDateString() === dateKey);
};

export const getEventsForDateRange = async (startDate: Date, endDate: Date): Promise<CalendarEvent[]> => {
  const events = await getCalendarEvents();
  return events.filter(event => {
    const eventStart = asDate(event.startDate);
    return eventStart >= startDate && eventStart <= endDate;
  });
};

export const syncWithNativeCalendar = async (): Promise<number> => {
  if (Platform.OS !== 'android' || !NativeCalendar) return 0;
  if (!(await checkCalendarPermissions()).granted) throw new Error('Calendar permissions have not been granted.');
  const events = await getCalendarEvents();
  let syncedCount = 0;
  for (const event of events) {
    if (event.nativeEventId) continue;
    try {
      event.nativeEventId = await addToNativeCalendar(event);
      syncedCount++;
    } catch (error) {
      console.warn(`Could not sync event ${event.id}:`, error);
    }
  }
  await saveCalendarEvents(events);
  return syncedCount;
};

export const createEventFromHaradaAction = (
  title: string,
  description: string,
  startDate: Date,
  durationMinutes = 30,
  haradaGridId?: string,
  haradaPillarId?: string,
  haradaCellId?: string
): Omit<CalendarEvent, 'id' | 'isHaradaEvent' | 'nativeEventId'> => ({
  title,
  startDate,
  endDate: new Date(startDate.getTime() + durationMinutes * 60000),
  description,
  haradaGridId,
  haradaPillarId,
  haradaCellId,
});

export const scheduleHaradaAction = (
  title: string,
  description: string,
  date: Date,
  durationMinutes = 30,
  haradaGridId?: string,
  haradaPillarId?: string,
  haradaCellId?: string
): Promise<CalendarEvent> => addCalendarEvent(
  createEventFromHaradaAction(title, description, date, durationMinutes, haradaGridId, haradaPillarId, haradaCellId)
);

export default {
  getCalendarEvents,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getEventsForDate,
  getEventsForDateRange,
  addToNativeCalendar,
  updateNativeCalendarEvent,
  deleteFromNativeCalendar,
  checkCalendarPermissions,
  requestCalendarPermissions,
  syncWithNativeCalendar,
  createEventFromHaradaAction,
  scheduleHaradaAction,
};
