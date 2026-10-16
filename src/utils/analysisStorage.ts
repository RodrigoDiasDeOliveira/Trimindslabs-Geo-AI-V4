import { SavedAreaAnalysis } from '../types';
import { INITIAL_SAVED_ANALYSES } from '../data/mapSourcesData';

const STORAGE_KEY = 'triminds_saved_area_analyses_v1';

// Known demo records are excluded during migration, while user-created records are preserved.
const DEMO_ANALYSIS_IDS = new Set(INITIAL_SAVED_ANALYSES.map((analysis) => analysis.id));

export const getSavedAnalyses = (): SavedAreaAnalysis[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Start with an empty library; demo fixtures must not appear as user analyses.
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.error('Saved analyses storage is not an array; preserving the raw value for recovery.');
      return [];
    }

    const userAnalyses = (parsed as SavedAreaAnalysis[]).filter(
      (analysis) => analysis && typeof analysis.id === 'string' && !DEMO_ANALYSIS_IDS.has(analysis.id)
    );

    // One-time cleanup of known seeded examples only; all other saved records remain intact.
    if (userAnalyses.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userAnalyses));
    }
    return userAnalyses;
  } catch (err) {
    console.error('Failed to parse saved analyses from localStorage', err);
    return [];
  }
};

export const saveAnalysisToStorage = (analysis: SavedAreaAnalysis): SavedAreaAnalysis[] => {
  try {
    const list = getSavedAnalyses();
    const existingIndex = list.findIndex(a => a.id === analysis.id);
    let updated: SavedAreaAnalysis[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = { ...analysis, updatedAt: new Date().toISOString() };
    } else {
      updated = [analysis, ...list];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save analysis to localStorage', err);
    return getSavedAnalyses();
  }
};

export const updateAnalysisInStorage = (
  id: string,
  fields: Partial<SavedAreaAnalysis>
): SavedAreaAnalysis[] => {
  try {
    const list = getSavedAnalyses();
    const updated = list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...fields,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to update analysis in localStorage', err);
    return getSavedAnalyses();
  }
};

export const deleteAnalysisFromStorage = (id: string): SavedAreaAnalysis[] => {
  try {
    const list = getSavedAnalyses();
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Failed to delete analysis from localStorage', err);
    return getSavedAnalyses();
  }
};
