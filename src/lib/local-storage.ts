
"use client";

import type { SerializableAppState, QueuedWorkout } from "@/types/fitness";

const APP_STATE_KEY = "fitnessFocusAppState";

/**
 * Saves the current application state to localStorage.
 * Merges with existing state to avoid overwriting unrelated parts (like the sync queue).
 * @param appState - The partial state to save.
 */
export function saveCurrentAppState(appState: Partial<SerializableAppState>): void {
  if (typeof window === 'undefined') return;
  try {
    const existingState = loadCurrentAppState() || {};
    const newState = { ...existingState, ...appState };
    const stateString = JSON.stringify(newState);
    window.localStorage.setItem(APP_STATE_KEY, stateString);
  } catch (error) {
    console.error("Failed to save app state to localStorage:", error);
  }
}

/**
 * Loads the application state from localStorage.
 * @returns The saved application state or null if it doesn't exist or fails to parse.
 */
export function loadCurrentAppState(): SerializableAppState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stateString = window.localStorage.getItem(APP_STATE_KEY);
    if (!stateString) return null;
    return JSON.parse(stateString) as SerializableAppState;
  } catch (error) {
    console.error("Failed to load app state from localStorage:", error);
    // If parsing fails, clear the corrupted state
    window.localStorage.removeItem(APP_STATE_KEY);
    return null;
  }
}

/**
 * Retrieves the sync queue from localStorage.
 * @returns An array of queued workouts.
 */
export function getSyncQueue(): QueuedWorkout[] {
  const state = loadCurrentAppState();
  return state?.queuedWorkouts || [];
}

/**
 * Clears the sync queue in localStorage.
 */
export function clearSyncQueue(): void {
  const state = loadCurrentAppState();
  if (state) {
    saveCurrentAppState({ ...state, queuedWorkouts: [] });
  }
}
