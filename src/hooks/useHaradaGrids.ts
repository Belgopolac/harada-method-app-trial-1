import { useState, useEffect, useCallback } from 'react';
import { HaradaGrid, HaradaPillar, HaradaCell } from '../types';
import {
  getHaradaGrids,
  saveHaradaGrids,
  getActiveGridId,
  setActiveGridId,
} from '../utils/storage';
import { createNewHaradaGrid, generateId } from '../utils/harada';

const asDate = (value: Date | string | undefined, fallback = new Date()): Date => {
  if (!value) return fallback;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const normalizeGrid = (grid: HaradaGrid): HaradaGrid => ({
  ...grid,
  createdAt: asDate(grid.createdAt),
  updatedAt: asDate(grid.updatedAt),
  pillars: (grid.pillars ?? []).map(pillar => ({
    ...pillar,
    cells: (pillar.cells ?? []).map(cell => ({
      ...cell,
      createdAt: asDate(cell.createdAt),
      updatedAt: asDate(cell.updatedAt),
      lastCompleted: cell.lastCompleted ? asDate(cell.lastCompleted) : undefined,
    })),
  })),
});

export const useHaradaGrids = () => {
  const [grids, setGrids] = useState<HaradaGrid[]>([]);
  const [activeGridId, setActiveGridIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGrids = useCallback(async () => {
    setLoading(true);
    try {
      const [storedGrids, storedActiveId] = await Promise.all([
        getHaradaGrids(),
        getActiveGridId(),
      ]);
      const normalized = storedGrids.map(normalizeGrid);
      const resolvedActiveId = normalized.some(grid => grid.id === storedActiveId)
        ? storedActiveId
        : normalized.find(grid => grid.isActive)?.id ?? null;
      setGrids(normalized.map(grid => ({ ...grid, isActive: grid.id === resolvedActiveId })));
      setActiveGridIdState(resolvedActiveId);
      setError(null);
    } catch (loadError) {
      console.error('Failed to load Harada grids:', loadError);
      setError('Failed to load Harada grids');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGrids();
  }, [loadGrids]);

  useEffect(() => {
    if (loading) return;
    saveHaradaGrids(grids).catch(saveError => {
      console.error('Failed to save Harada grids:', saveError);
      setError('Failed to save Harada grids');
    });
  }, [grids, loading]);

  useEffect(() => {
    if (loading) return;
    setActiveGridId(activeGridId).catch(saveError => {
      console.error('Failed to save active grid ID:', saveError);
      setError('Failed to save active goal');
    });
  }, [activeGridId, loading]);

  const getAllGrids = useCallback(() => grids, [grids]);

  const getActiveGrid = useCallback((): HaradaGrid | null => {
    if (activeGridId) return grids.find(grid => grid.id === activeGridId) ?? null;
    return grids.find(grid => grid.isActive) ?? null;
  }, [activeGridId, grids]);

  const getGridById = useCallback((gridId: string): HaradaGrid | null => {
    return grids.find(grid => grid.id === gridId) ?? null;
  }, [grids]);

  // Keep the existing synchronous API used by screens; persistence is handled by effects above.
  const createGrid = useCallback((title = 'My Goal'): HaradaGrid => {
    const newGrid = createNewHaradaGrid(title);
    const shouldActivate = activeGridId === null && grids.length === 0;
    newGrid.isActive = shouldActivate;
    setGrids(current => [...current.map(grid => shouldActivate ? { ...grid, isActive: false } : grid), newGrid]);
    if (shouldActivate) setActiveGridIdState(newGrid.id);
    return newGrid;
  }, [activeGridId, grids.length]);

  const updateGrid = useCallback((gridIdOrGrid: string | HaradaGrid, updates?: Partial<HaradaGrid>): void => {
    const targetId = typeof gridIdOrGrid === 'string' ? gridIdOrGrid : gridIdOrGrid.id;
    const patch = typeof gridIdOrGrid === 'string' ? updates : gridIdOrGrid;
    if (!patch) return;
    setGrids(current => current.map(grid => grid.id === targetId
      ? { ...grid, ...patch, updatedAt: new Date() }
      : grid));
  }, []);

  const deleteGrid = useCallback((gridId: string): void => {
    setGrids(current => current.filter(grid => grid.id !== gridId));
    if (activeGridId === gridId) {
      setActiveGridIdState(null);
    }
  }, [activeGridId]);

  const setActiveGrid = useCallback((gridId: string | null): void => {
    setActiveGridIdState(gridId);
    setGrids(current => current.map(grid => ({ ...grid, isActive: grid.id === gridId })));
  }, []);

  const updateMainGoal = useCallback((gridId: string, mainGoal: string, description?: string): void => {
    updateGrid(gridId, { mainGoal, mainGoalDescription: description });
  }, [updateGrid]);

  const updatePillar = useCallback((gridId: string, pillarId: string, updates: Partial<HaradaPillar>): void => {
    setGrids(current => current.map(grid => grid.id !== gridId ? grid : ({
      ...grid,
      pillars: grid.pillars.map(pillar => pillar.id === pillarId ? { ...pillar, ...updates } : pillar),
      updatedAt: new Date(),
    })));
  }, []);

  const updateCell = useCallback((gridId: string, pillarId: string, cellId: string, updates: Partial<HaradaCell>): void => {
    setGrids(current => current.map(grid => grid.id !== gridId ? grid : ({
      ...grid,
      pillars: grid.pillars.map(pillar => pillar.id !== pillarId ? pillar : ({
        ...pillar,
        cells: pillar.cells.map(cell => cell.id === cellId ? { ...cell, ...updates, updatedAt: new Date() } : cell),
      })),
      updatedAt: new Date(),
    })));
  }, []);

  const toggleCellCompletion = useCallback((gridId: string, pillarId: string, cellId: string): void => {
    const now = new Date();
    setGrids(current => current.map(grid => grid.id !== gridId ? grid : ({
      ...grid,
      pillars: grid.pillars.map(pillar => pillar.id !== pillarId ? pillar : ({
        ...pillar,
        cells: pillar.cells.map(cell => {
          if (cell.id !== cellId) return cell;
          const isComplete = !cell.isComplete;
          return {
            ...cell,
            isComplete,
            completionCount: isComplete ? cell.completionCount + 1 : cell.completionCount,
            lastCompleted: isComplete ? now : undefined,
            updatedAt: now,
          };
        }),
      })),
      updatedAt: now,
    })));
  }, []);

  const addPillar = useCallback((gridId: string, title = ''): void => {
    const now = new Date();
    const newPillar: HaradaPillar = {
      id: generateId(),
      title,
      description: '',
      cells: Array(8).fill(null).map(() => ({
        id: generateId(),
        text: '',
        isComplete: false,
        completionCount: 0,
        createdAt: now,
        updatedAt: now,
      })),
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    };
    setGrids(current => current.map(grid => grid.id === gridId
      ? { ...grid, pillars: [...grid.pillars, newPillar], updatedAt: now }
      : grid));
  }, []);

  const removePillar = useCallback((gridId: string, pillarId: string): void => {
    setGrids(current => current.map(grid => grid.id === gridId
      ? { ...grid, pillars: grid.pillars.filter(pillar => pillar.id !== pillarId), updatedAt: new Date() }
      : grid));
  }, []);

  const addCell = useCallback((gridId: string, pillarId: string, cell: Omit<HaradaCell, 'id' | 'isComplete' | 'completionCount' | 'lastCompleted'>): void => {
    const newCell: HaradaCell = { ...cell, id: generateId(), isComplete: false, completionCount: 0 };
    setGrids(current => current.map(grid => grid.id !== gridId ? grid : ({
      ...grid,
      pillars: grid.pillars.map(pillar => pillar.id === pillarId ? { ...pillar, cells: [...pillar.cells, newCell] } : pillar),
      updatedAt: new Date(),
    })));
  }, []);

  const deletePillar = removePillar;
  const toggleCellComplete = toggleCellCompletion;

  return {
    grids,
    activeGridId,
    loading,
    error,
    loadGrids,
    getAllGrids,
    createGrid,
    updateGrid,
    deleteGrid,
    setActiveGrid,
    getActiveGrid,
    getGridById,
    updateMainGoal,
    updatePillar,
    updateCell,
    toggleCellCompletion,
    toggleCellComplete,
    addPillar,
    removePillar,
    deletePillar,
    addCell,
  };
};

export default useHaradaGrids;
