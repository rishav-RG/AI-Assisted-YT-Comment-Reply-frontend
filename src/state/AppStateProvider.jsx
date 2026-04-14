import { createContext, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "yt-reply-workflow-state-v1";

const defaultState = {
  connectedHint: false,
  lastHealth: null,
  lastSync: null,
  history: []
};

const AppStateContext = createContext(null);

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }
    return {
      ...defaultState,
      ...JSON.parse(raw)
    };
  } catch {
    return defaultState;
  }
}

function writeState(nextState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // Ignore localStorage errors so app remains usable.
  }
}

function createHistoryEntry(entry) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...entry
  };
}

export function AppStateProvider({ children }) {
  const [state, setState] = useState(readState);

  const update = (updater) => {
    setState((prev) => {
      const next = updater(prev);
      writeState(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      state,
      markConnected: (connected) => {
        update((prev) => ({
          ...prev,
          connectedHint: connected
        }));
      },
      setHealthCheck: (health) => {
        update((prev) => ({
          ...prev,
          lastHealth: {
            ...health,
            checkedAt: new Date().toISOString()
          }
        }));
      },
      setLastSync: (syncPayload) => {
        update((prev) => ({
          ...prev,
          lastSync: syncPayload
        }));
      },
      addHistory: (entry) => {
        update((prev) => ({
          ...prev,
          history: [createHistoryEntry(entry), ...prev.history].slice(0, 80)
        }));
      },
      clearHistory: () => {
        update((prev) => ({
          ...prev,
          history: []
        }));
      }
    }),
    [state]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return ctx;
}