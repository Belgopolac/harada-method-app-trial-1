import { Platform } from 'react-native';
import { CalendarEvent } from '../types';
import { getCalendarEvents, saveCalendarEvents } from '../utils/storage';
import { generateId } from '../utils/harada';

export const addCalendarEvent = async (
  event: Omit<CalendarEvent, 'id' | 'isHaradaEvent'>
): Promise<CalendarEvent> => {
  const newEvent: CalendarEvent = {
    ...event,
    id: generateId(),
    isHaradaEvent: true,
  };
  const events = await getCalendarEvents();
  events.push(newEvent);
  await saveCalendarEvents(events);
  if (Platform.OS !== 'web') {
    try {
      await addToNativeCalendar(newEvent);
    } catch (error) {
      console.log('Could not add to native calendar:', error);
    }
  }
  return newEvent;
};

export const updateCalendarEvent = async (
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent | null> => {
  const events = await getCalendarEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index === -1) return null;
  const updatedEvent = { ...events[index], ...updates };
  events[index] = updatedEvent;
  await saveCalendarEvents(events);
  if (Platform.OS !== 'web') {
    try {
      await updateNativeCalendarEvent(updatedEvent);
    } catch (error) {
      console.log('Could not update native calendar:', error);
    }
  }
  return updatedEvent;
};

export const deleteCalendarEvent = async (eventId: string): Promise<boolean> => {
  const events = await getCalendarEvents();
  const filteredEvents = events.filter(e => e.id !== eventId);
  await saveCalendarEvents(filteredEvents);
  if (Platform.OS !== 'web') {
    try {
      await deleteFromNativeCalendar(eventId);
    } catch (error) {
      console.log('Could not delete from native calendar:', error);
    }
  }
  return true;
};

export const getEventsForDate = async (date: Date): Promise<CalendarEvent[]> => {
  const events = await getCalendarEvents();
  const dateString = date.toISOString().split('T')[0];
  return events.filter(event => {
    const eventDateString = new Date(event.startDate).toISOString().split('T')[0];
    return eventDateString === dateString;
  });
};

export const getEventsForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> => {
  const events = await getCalendarEvents();
  return events.filter(event => {
    const eventStart = new Date(event.startDate);
    return eventStart >= startDate && eventStart <= endDate;
  });
};

export const addToNativeCalendar = async (event: CalendarEvent): Promise<string> => {
  console.log('Adding to native calendar:', event);
  return event.id;
};

export const updateNativeCalendarEvent = async (event: CalendarEvent): Promise<boolean> => {
  console.log('Updating native calendar event:', event);
  return true;
};

export const deleteFromNativeCalendar = async (eventId: string): Promise<boolean> => {
  console.log('Deleting from native calendar:', eventId);
  return true;
};

export const checkCalendarPermissions = async (): Promise<{ granted: boolean; canRequest: boolean }> => {
  return { granted: false, canRequest: true };
};

export const requestCalendarPermissions = async (): Promise<boolean> => {
  console.log('Requesting calendar permissions...');
  return false;
};

export const syncWithNativeCalendar = async (): Promise<number> => {
  const localEvents = await getCalendarEvents();
  const haradaEvents = localEvents.filter(e => e.isHaradaEvent);
  let syncedCount = 0;
  for (const event of haradaEvents) {
    try {
      await addToNativeCalendar(event);
      syncedCount++;
    } catch (error) {
      console.log('Failed to sync event:', event.id, error);
    }
  }
  return syncedCount;
};

export const createEventFromHaradaAction = (
  title: string,
  description: string,
  startDate: Date,
  durationMinutes: number = 30,
  haradaGridId?: string,
  haradaPillarId?: string,
  haradaCellId?: string
): Omit<CalendarEvent, 'id' | 'isHaradaEvent'> => {
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return { title, startDate, endDate, description, haradaGridId, haradaPillarId, haradaCellId };
};

export const scheduleHaradaAction = async (
  title: string,
  description: string,
  date: Date,
  durationMinutes: number = 30,
  haradaGridId?: string,
  haradaPillarId?: string,
  haradaCellId?: string
): Promise<CalendarEvent> => {
  const event = createEventFromHaradaAction(
    title, description, date, durationMinutes,
    haradaGridId, haradaPillarId, haradaCellId
  );
  return addCalendarEvent(event);
};

export default {
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
