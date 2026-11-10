import { useCallback, useEffect, useState } from 'react';
import { CalendarEvent } from '../types';
import * as CalendarService from '../services/calendar';

export interface CalendarState {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  permissionsGranted: boolean;
  canRequestPermissions: boolean;
  syncing: boolean;
}

type NewCalendarEvent = Omit<CalendarEvent, 'id' | 'isHaradaEvent' | 'nativeEventId'>;

export const useCalendar = () => {
  const [state, setState] = useState<CalendarState>({
    events: [],
    loading: true,
    error: null,
    permissionsGranted: false,
    canRequestPermissions: true,
    syncing: false,
  });

  const refreshEvents = useCallback(async (): Promise<void> => {
    try {
      const events = await CalendarService.getCalendarEvents();
      setState(current => ({ ...current, events, error: null }));
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      setState(current => ({ ...current, error: 'Failed to load calendar events' }));
    }
  }, []);

  const refreshPermissions = useCallback(async (): Promise<boolean> => {
    const permissions = await CalendarService.checkCalendarPermissions();
    setState(current => ({
      ...current,
      permissionsGranted: permissions.granted,
      canRequestPermissions: permissions.canRequest,
    }));
    return permissions.granted;
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadInitialState = async () => {
      try {
        const [events, permissions] = await Promise.all([
          CalendarService.getCalendarEvents(),
          CalendarService.checkCalendarPermissions(),
        ]);
        if (mounted) {
          setState({
            events,
            loading: false,
            error: null,
            permissionsGranted: permissions.granted,
            canRequestPermissions: permissions.canRequest,
            syncing: false,
          });
        }
      } catch (error) {
        console.error('Failed to initialize calendar:', error);
        if (mounted) {
          setState(current => ({ ...current, loading: false, error: 'Failed to load calendar data' }));
        }
      }
    };
    loadInitialState();
    return () => { mounted = false; };
  }, []);

  const addEvent = useCallback(async (event: NewCalendarEvent): Promise<CalendarEvent | null> => {
    try {
      const created = await CalendarService.addCalendarEvent(event);
      setState(current => ({ ...current, events: [...current.events.filter(item => item.id !== created.id), created], error: null }));
      return created;
    } catch (error) {
      console.error('Failed to add calendar event:', error);
      setState(current => ({ ...current, error: 'Failed to add calendar event' }));
      return null;
    }
  }, []);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
    try {
      const updated = await CalendarService.updateCalendarEvent(eventId, updates);
      if (updated) {
        setState(current => ({ ...current, events: current.events.map(event => event.id === eventId ? updated : event), error: null }));
      }
      return updated;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      setState(current => ({ ...current, error: 'Failed to update calendar event' }));
      return null;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const deleted = await CalendarService.deleteCalendarEvent(eventId);
      if (deleted) setState(current => ({ ...current, events: current.events.filter(event => event.id !== eventId), error: null }));
      return deleted;
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      setState(current => ({ ...current, error: 'Failed to delete calendar event' }));
      return false;
    }
  }, []);

  const getEventsForDate = useCallback((date: Date): Promise<CalendarEvent[]> => {
    return CalendarService.getEventsForDate(date);
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await CalendarService.requestCalendarPermissions();
      setState(current => ({ ...current, permissionsGranted: granted, canRequestPermissions: true, error: null }));
      return granted;
    } catch (error) {
      console.error('Failed to request calendar permissions:', error);
      setState(current => ({ ...current, error: 'Failed to request calendar permissions' }));
      return false;
    }
  }, []);

  const syncWithNativeCalendar = useCallback(async (): Promise<number> => {
    setState(current => ({ ...current, syncing: true, error: null }));
    try {
      const count = await CalendarService.syncWithNativeCalendar();
      const [events, permissions] = await Promise.all([
        CalendarService.getCalendarEvents(),
        CalendarService.checkCalendarPermissions(),
      ]);
      setState(current => ({
        ...current,
        events,
        permissionsGranted: permissions.granted,
        canRequestPermissions: permissions.canRequest,
        syncing: false,
      }));
      return count;
    } catch (error) {
      console.error('Failed to sync calendar:', error);
      setState(current => ({ ...current, syncing: false, error: 'Failed to sync with native calendar' }));
      return 0;
    }
  }, []);

  const scheduleHaradaAction = useCallback(async (
    title: string,
    description: string,
    date: Date,
    durationMinutes = 30,
    haradaGridId?: string,
    haradaPillarId?: string,
    haradaCellId?: string
  ): Promise<CalendarEvent | null> => {
    try {
      const event = await CalendarService.scheduleHaradaAction(
        title,
        description,
        date,
        durationMinutes,
        haradaGridId,
        haradaPillarId,
        haradaCellId
      );
      setState(current => ({ ...current, events: [...current.events.filter(item => item.id !== event.id), event], error: null }));
      return event;
    } catch (error) {
      console.error('Failed to schedule Harada action:', error);
      setState(current => ({ ...current, error: 'Failed to schedule Harada action' }));
      return null;
    }
  }, []);

  return {
    ...state,
    loadEvents: refreshEvents,
    refreshEvents,
    checkPermissions: refreshPermissions,
    addEvent,
    addCalendarEvent: addEvent,
    updateEvent,
    updateCalendarEvent: updateEvent,
    deleteEvent,
    deleteCalendarEvent: deleteEvent,
    getEventsForDate,
    requestPermissions,
    syncWithNativeCalendar,
    scheduleHaradaAction,
  };
};

export default useCalendar;
