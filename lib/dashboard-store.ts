import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { DashboardState, PrepModeWindow } from "@/types/sentinel";

const STATE_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(STATE_DIR, "dashboard-state.json");

const defaultState: DashboardState = {
  prepModeWindows: [],
  lastUpdated: new Date().toISOString(),
};

async function ensureDataDir() {
  await mkdir(STATE_DIR, { recursive: true });
}

export async function getDashboardState(): Promise<DashboardState> {
  try {
    await ensureDataDir();
    const raw = await readFile(STATE_FILE, "utf-8");
    const state = JSON.parse(raw) as DashboardState;
    return {
      ...defaultState,
      ...state,
      prepModeWindows: state.prepModeWindows ?? [],
    };
  } catch {
    return { ...defaultState };
  }
}

export async function setDashboardState(state: DashboardState): Promise<void> {
  await ensureDataDir();
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

export async function addPrepModeWindow(window: PrepModeWindow): Promise<void> {
  const state = await getDashboardState();
  const exists = state.prepModeWindows.some((w) => w.id === window.id);
  if (exists) return;
  state.prepModeWindows.push(window);
  state.prepModeWindows.sort(
    (a, b) => new Date(a.prepStart).getTime() - new Date(b.prepStart).getTime()
  );
  state.lastUpdated = new Date().toISOString();
  await setDashboardState(state);
}

export async function clearPrepModeWindow(id: string): Promise<void> {
  const state = await getDashboardState();
  state.prepModeWindows = state.prepModeWindows.filter((w) => w.id !== id);
  state.lastUpdated = new Date().toISOString();
  await setDashboardState(state);
}
