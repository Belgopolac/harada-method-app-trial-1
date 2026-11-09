import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent } from '../types';
import * as CalendarService from '../services/calendar';

export interface CalendarState {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  permissionsGranted: boolean;
  canRequestPermissions: boolean;
}

export const useCalendar = () => {
  const [state, setState] = useState<CalendarState>({
    events: [],
    loading: true,
    error: null,
    permissionsGranted: false,
    canRequestPermissions: true,
  });

  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const events = await CalendarService.getCalendarEvents();
        const permissions = await CalendarService.checkCalendarPermissions();
        setState({
          events,
          loading: false,
          error: null,
          permissionsGranted: permissions.granted,
          canRequestPermissions: permissions.canRequest,
        });
      } catch (err) {
        setState({
          events: [],
          loading: false,
          error: 'Failed to load calendar data',
          permissionsGranted: false,
          canRequestPermissions: true,
        });
        console.error(err);
      }
    };
    loadInitialState();
  }, []);

  const refreshEvents = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const events = await CalendarService.getCalendarEvents();
      setState(prev => ({ ...prev, events, loading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to refresh calendar events',
      }));
      console.error(err);
    }
  }, []);

  const addEvent = useCallback(
    async (event: Omit<CalendarEvent, 'id' | 'isHaradaEvent'>): Promise<CalendarEvent | null> => {
      try {
        const newEvent = await CalendarService.addCalendarEvent(event);
        setState(prev => ({ ...prev, events: [...prev.events, newEvent] }));
        return newEvent;
      } catch (err) {
        setState(prev => ({ ...prev, error: 'Failed to add calendar event' }));
        console.error(err);
        return null;
      }
    },
    []
  );

  const updateEvent = useCallback(
    async (eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
      try {
        const updatedEvent = await CalendarService.updateCalendarEvent(eventId, updates);
        if (updatedEvent) {
          setState(prev => ({
            ...prev,
            events: prev.events.map(e => (e.id === eventId ? updatedEvent : e)),
          }));
        }
        return updatedEvent;
      } catch (err) {
        setState(prev => ({ ...prev, error: 'Failed to update calendar event' }));
        console.error(err);
        return null;
      }
    },
    []
  );

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const success = await CalendarService.deleteCalendarEvent(eventId);
      if (success) {
        setState(prev => ({
          ...prev,
          events: prev.events.filter(e => e.id !== eventId),
        }));
      }
      return success;
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to delete calendar event' }));
      console.error(err);
      return false;
    }
  }, []);

  const getEventsForDate = useCallback(
    async (date: Date): Promise<CalendarEvent[]> => {
      return CalendarService.getEventsForDate(date);
    },
    []
  );

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await CalendarService.requestCalendarPermissions();
      setState(prev => ({ ...prev, permissionsGranted: granted }));
      return granted;
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to request calendar permissions' }));
      console.error(err);
      return false;
    }
  }, []);

  const syncWithNativeCalendar = useCallback(async (): Promise<number> => {
    try {
      const syncedCount = await CalendarService.syncWithNativeCalendar();
      await refreshEvents();
      return syncedCount;
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to sync with native calendar' }));
      console.error(err);
      return 0;
    }
  }, [refreshEvents]);

  const scheduleHaradaAction = useCallback(
    async (
      title: string,
      description: string,
      date: Date,
      durationMinutes: number = 30,
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
        setState(prev => ({ ...prev, events: [...prev.events, event] }));
        return event;
      } catch (err) {
        setState(prev => ({ ...prev, error: 'Failed to schedule Harada action' }));
        console.error(err);
        return null;
      }
    },
    []
  );

  return {
    ...state,
    refreshEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    requestPermissions,
    syncWithNativeCalendar,
    scheduleHaradaAction,
  };
};

export default useCalendar;
