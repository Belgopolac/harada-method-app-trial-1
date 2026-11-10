// Harada Method Types

export interface HaradaCell {
  id: string;
  text: string;
  description?: string;
  isComplete: boolean;
  completionCount: number;
  lastCompleted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface HaradaPillar {
  id: string;
  title: string;
  description?: string;
  cells: HaradaCell[];
  color?: string;
}

export interface HaradaGrid {
  id: string;
  title: string;
  mainGoal: string;
  mainGoalDescription?: string;
  pillars: HaradaPillar[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface DailyRoutineItem {
  id: string;
  text: string;
  pillarId?: string;
  cellId?: string;
  durationMinutes?: number;
  scheduledTime?: string;
  isComplete: boolean;
  completionStreak: number;
  lastCompleted?: Date;
}

// Diary timestamps are ISO-8601 strings so they can be passed through navigation and storage safely.
export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  reflections: string[];
  mood: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  darkMode: boolean;
  autoSyncCalendar: boolean;
  showTutorial: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  location?: string;
  isHaradaEvent: boolean;
  nativeEventId?: string;
  haradaGridId?: string;
  haradaPillarId?: string;
  haradaCellId?: string;
}

export type RootStackParamList = {
  Home: undefined;
  GridList: undefined;
  GridDetail: { gridId: string };
  GridEditor: { gridId?: string };
  Calendar: undefined;
  DailyRoutine: undefined;
  Diary: { date?: string } | undefined;
  DiaryEditor: { entryId?: string; date?: string } | undefined;
  Settings: undefined;
};
