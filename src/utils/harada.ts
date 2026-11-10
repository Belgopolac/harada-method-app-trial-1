import { v4 as uuidv4 } from 'uuid';
import { HaradaGrid, HaradaPillar, HaradaCell } from '../types';

const pillarColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#F8B739', '#52B788', '#FF6B9D', '#A5D8FF',
];

/** Generate a unique ID. */
export const generateId = (): string => uuidv4();

const createGridPillar = (): HaradaPillar => ({
  id: generateId(),
  title: '',
  description: '',
  cells: Array(8).fill(null).map(() => createEmptyCell('')),
  color: getRandomColor(),
});

/** Create a Harada grid with the standard eight pillars and eight cells per pillar. */
export const createNewHaradaGrid = (title = 'My Goal'): HaradaGrid => ({
  id: generateId(),
  title,
  mainGoal: '',
  mainGoalDescription: '',
  pillars: Array(8).fill(null).map(createGridPillar),
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
});

/** Format a Date or ISO date string for display. */
export const formatDate = (date: Date | string): string => {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/** Format a Date or ISO date string for compact display. */
export const formatShortDate = (date: Date | string): string => {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** Format a Date or ISO date string as a local time. */
export const formatTime = (date: Date | string): string => {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const getTodayDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const getCurrentTimeString = (): string => new Date().toTimeString().slice(0, 5);

export const getRandomColor = (): string => pillarColors[Math.floor(Math.random() * pillarColors.length)];

/** Progress as an unrounded percentage; returns zero for empty grids. */
export const calculateGridProgress = (grid: HaradaGrid | null | undefined): number => {
  if (!grid?.pillars?.length) return 0;
  const cells = grid.pillars.flatMap(pillar => pillar.cells ?? []);
  if (cells.length === 0) return 0;
  return cells.filter(cell => cell.isComplete).length / cells.length * 100;
};

/** Existing screen-facing helper, rounded to a whole-number percentage. */
export const calculateGridCompletion = (grid: HaradaGrid): number => Math.round(calculateGridProgress(grid));

export const calculatePillarProgress = (pillar: HaradaPillar | null | undefined): number => {
  if (!pillar?.cells?.length) return 0;
  return pillar.cells.filter(cell => cell.isComplete).length / pillar.cells.length * 100;
};

export const getAllCells = (grid: HaradaGrid | null | undefined) => {
  if (!grid?.pillars) return [];
  return grid.pillars.flatMap(pillar => (pillar.cells ?? []).map(cell => ({
    ...cell,
    pillarId: pillar.id,
    pillarTitle: pillar.title,
  })));
};

export const getAllActionsFromGrid = (grid: HaradaGrid): { pillar: HaradaPillar; cell: HaradaCell }[] => {
  const actions: { pillar: HaradaPillar; cell: HaradaCell }[] = [];
  grid.pillars.forEach(pillar => {
    pillar.cells.forEach(cell => {
      if (cell.text.trim()) actions.push({ pillar, cell });
    });
  });
  return actions;
};

export const getDailyActions = (grid: HaradaGrid): { pillar: HaradaPillar; cell: HaradaCell }[] => getAllActionsFromGrid(grid);

export const getActionsForPillar = (grid: HaradaGrid, pillarId: string): { pillar: HaradaPillar; cell: HaradaCell }[] => {
  const pillar = grid.pillars.find(item => item.id === pillarId);
  return pillar ? pillar.cells.filter(cell => cell.text.trim()).map(cell => ({ pillar, cell })) : [];
};

export const getTodaysCells = (grid: HaradaGrid, _date = new Date()) => getAllCells(grid);
export const getIncompleteCells = (grid: HaradaGrid) => getAllCells(grid).filter(cell => !cell.isComplete);
export const getCellsDueToday = (grid: HaradaGrid) => getTodaysCells(grid);

/** Create an empty grid for flows that collect the goal before adding pillars. */
export const createEmptyGrid = (title: string, mainGoal: string): HaradaGrid => ({
  id: generateId(),
  title,
  mainGoal,
  mainGoalDescription: '',
  pillars: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: false,
});

/** Create an empty pillar. The editor can add action cells afterward. */
export const createEmptyPillar = (title: string): HaradaPillar => ({
  id: generateId(),
  title,
  description: '',
  cells: [],
  color: getRandomColor(),
});

/** Create a new incomplete action cell. */
export const createEmptyCell = (text: string): HaradaCell => {
  const now = new Date();
  return {
    id: generateId(),
    text,
    description: '',
    isComplete: false,
    completionCount: 0,
    createdAt: now,
    updatedAt: now,
  };
};

/** Count distinct completion dates. This is a total, not a consecutive-day streak. */
export const getStreak = (grid: HaradaGrid | null | undefined): number => {
  if (!grid?.pillars) return 0;
  const completedDays = new Set<string>();
  grid.pillars.forEach(pillar => {
    pillar.cells?.forEach(cell => {
      if (!cell.isComplete || !cell.lastCompleted) return;
      const completedAt = cell.lastCompleted instanceof Date ? cell.lastCompleted : new Date(cell.lastCompleted);
      if (!Number.isNaN(completedAt.getTime())) {
        const localDay = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, '0')}-${String(completedAt.getDate()).padStart(2, '0')}`;
        completedDays.add(localDay);
      }
    });
  });
  return completedDays.size;
};

export default {
  generateId,
  createNewHaradaGrid,
  createEmptyGrid,
  createEmptyPillar,
  createEmptyCell,
  getRandomColor,
  formatDate,
  formatShortDate,
  formatTime,
  getTodayDateString,
  getCurrentTimeString,
  calculateGridProgress,
  calculateGridCompletion,
  calculatePillarProgress,
  getAllCells,
  getAllActionsFromGrid,
  getDailyActions,
  getActionsForPillar,
  getTodaysCells,
  getIncompleteCells,
  getCellsDueToday,
  getStreak,
};
