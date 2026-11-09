import { v4 as uuidv4 } from 'uuid';
import { HaradaGrid, HaradaPillar, HaradaCell } from '../types';

const createEmptyPillar = (): HaradaPillar => ({
  id: uuidv4(),
  title: '',
  description: '',
  cells: Array(8).fill(null).map(() => ({
    id: uuidv4(),
    text: '',
    isComplete: false,
    completionCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  color: getRandomColor(),
});

const getRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8B739', '#52B788', '#FF6B9D', '#A5D8FF',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const createNewHaradaGrid = (title: string = 'My Goal'): HaradaGrid => ({
  id: uuidv4(),
  title,
  mainGoal: '',
  mainGoalDescription: '',
  pillars: Array(8).fill(null).map(createEmptyPillar),
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
});

export const getAllActionsFromGrid = (grid: HaradaGrid): { pillar: HaradaPillar; cell: HaradaCell }[] => {
  const actions: { pillar: HaradaPillar; cell: HaradaCell }[] = [];
  grid.pillars.forEach(pillar => {
    pillar.cells.forEach(cell => {
      if (cell.text.trim()) {
        actions.push({ pillar, cell });
      }
    });
  });
  return actions;
};

export const getDailyActions = (grid: HaradaGrid): { pillar: HaradaPillar; cell: HaradaCell }[] => {
  return getAllActionsFromGrid(grid);
};

export const getActionsForPillar = (grid: HaradaGrid, pillarId: string): { pillar: HaradaPillar; cell: HaradaCell }[] => {
  const pillar = grid.pillars.find(p => p.id === pillarId);
  if (!pillar) return [];
  return pillar.cells.filter(cell => cell.text.trim()).map(cell => ({ pillar, cell }));
};

export const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const getCurrentTimeString = (): string => {
  const now = new Date();
  return now.toTimeString().substring(0, 5);
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateId = (): string => {
  return uuidv4();
};

export const calculateGridCompletion = (grid: HaradaGrid): number => {
  const totalCells = grid.pillars.reduce((sum, pillar) => sum + pillar.cells.length, 0);
  const completedCells = grid.pillars.reduce(
    (sum, pillar) => sum + pillar.cells.filter(cell => cell.isComplete).length,
    0
  );
  return Math.round((completedCells / totalCells) * 100);
};

export default {
  createNewHaradaGrid,
  getAllActionsFromGrid,
  getDailyActions,
  getActionsForPillar,
  getTodayDateString,
  getCurrentTimeString,
  formatDate,
  formatTime,
  generateId,
  calculateGridCompletion,
};
