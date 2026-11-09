import { useState, useEffect, useCallback } from 'react';
import { HaradaGrid, HaradaPillar, HaradaCell } from '../types';
import { getHaradaGrids, saveHaradaGrids, getActiveGridId, setActiveGridId } from '../utils/storage';
import { createNewHaradaGrid, generateId } from '../utils/harada';

export const useHaradaGrids = () => {
  const [grids, setGrids] = useState<HaradaGrid[]>([]);
  const [activeGridId, setActiveGridIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGrids = async () => {
      try {
        setLoading(true);
        const loadedGrids = await getHaradaGrids();
        const activeId = await getActiveGridId();
        setGrids(loadedGrids);
        setActiveGridIdState(activeId || null);
        setError(null);
      } catch (err) {
        setError('Failed to load Harada grids');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadGrids();
  }, []);

  useEffect(() => {
    if (!loading) {
      const saveGridsToStorage = async () => {
        try {
          await saveHaradaGrids(grids);
        } catch (err) {
          console.error('Failed to save grids:', err);
        }
      };
      saveGridsToStorage();
    }
  }, [grids, loading]);

  useEffect(() => {
    if (activeGridId !== null) {
      setActiveGridId(activeGridId);
    }
  }, [activeGridId]);

  const createGrid = useCallback((title: string = 'My Goal'): HaradaGrid => {
    const newGrid = createNewHaradaGrid(title);
    const updatedGrids = [...grids, newGrid];
    setGrids(updatedGrids);
    return newGrid;
  }, [grids]);

  const updateGrid = useCallback((gridId: string, updates: Partial<HaradaGrid>): void => {
    setGrids(prevGrids =>
      prevGrids.map(grid =>
        grid.id === gridId ? { ...grid, ...updates, updatedAt: new Date() } : grid
      )
    );
  }, []);

  const deleteGrid = useCallback((gridId: string): void => {
    setGrids(prevGrids => prevGrids.filter(grid => grid.id !== gridId));
    if (activeGridId === gridId) {
      setActiveGridIdState(null);
    }
  }, [activeGridId]);

  const setActiveGrid = useCallback((gridId: string | null): void => {
    setActiveGridIdState(gridId);
  }, []);

  const getActiveGrid = useCallback((): HaradaGrid | null => {
    if (!activeGridId) return null;
    return grids.find(grid => grid.id === activeGridId) || null;
  }, [activeGridId, grids]);

  const getGridById = useCallback((gridId: string): HaradaGrid | null => {
    return grids.find(grid => grid.id === gridId) || null;
  }, [grids]);

  const updateMainGoal = useCallback((gridId: string, mainGoal: string, description?: string): void => {
    updateGrid(gridId, { mainGoal, mainGoalDescription: description });
  }, [updateGrid]);

  const updatePillar = useCallback((gridId: string, pillarId: string, updates: Partial<HaradaPillar>): void => {
    setGrids(prevGrids =>
      prevGrids.map(grid => {
        if (grid.id !== gridId) return grid;
        return {
          ...grid,
          pillars: grid.pillars.map(pillar =>
            pillar.id === pillarId ? { ...pillar, ...updates } : pillar
          ),
          updatedAt: new Date(),
        };
      })
    );
  }, []);

  const updateCell = useCallback((gridId: string, pillarId: string, cellId: string, updates: Partial<HaradaCell>): void => {
    setGrids(prevGrids =>
      prevGrids.map(grid => {
        if (grid.id !== gridId) return grid;
        return {
          ...grid,
          pillars: grid.pillars.map(pillar => {
            if (pillar.id !== pillarId) return pillar;
            return {
              ...pillar,
              cells: pillar.cells.map(cell =>
                cell.id === cellId ? { ...cell, ...updates, updatedAt: new Date() } : cell
              ),
            };
          }),
          updatedAt: new Date(),
        };
      })
    );
  }, []);

  const toggleCellCompletion = useCallback((gridId: string, pillarId: string, cellId: string): void => {
    setGrids(prevGrids =>
      prevGrids.map(grid => {
        if (grid.id !== gridId) return grid;
        return {
          ...grid,
          pillars: grid.pillars.map(pillar => {
            if (pillar.id !== pillarId) return pillar;
            return {
              ...pillar,
              cells: pillar.cells.map(cell => {
                if (cell.id !== cellId) return cell;
                const now = new Date();
                const newCompletionCount = cell.isComplete ? cell.completionCount : cell.completionCount + 1;
                return {
                  ...cell,
                  isComplete: !cell.isComplete,
                  completionCount: newCompletionCount,
                  lastCompleted: cell.isComplete ? undefined : now,
                  updatedAt: now,
                };
              }),
            };
          }),
          updatedAt: new Date(),
        };
      })
    );
  }, []);

  const addPillar = useCallback((gridId: string, title: string = ''): void => {
    const newPillar: HaradaPillar = {
      id: generateId(),
      title,
      description: '',
      cells: Array(8).fill(null).map(() => ({
        id: generateId(),
        text: '',
        isComplete: false,
        completionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    };
    setGrids(prevGrids =>
      prevGrids.map(grid => {
        if (grid.id !== gridId) return grid;
        return {
          ...grid,
          pillars: [...grid.pillars, newPillar],
          updatedAt: new Date(),
        };
      })
    );
  }, []);

  const removePillar = useCallback((gridId: string, pillarId: string): void => {
    setGrids(prevGrids =>
      prevGrids.map(grid => {
        if (grid.id !== gridId) return grid;
        return {
          ...grid,
          pillars: grid.pillars.filter(pillar => pillar.id !== pillarId),
          updatedAt: new Date(),
        };
      })
    );
  }, []);

  return {
    grids,
    activeGridId,
    loading,
    error,
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
    addPillar,
    removePillar,
  };
};

export default useHaradaGrids;
