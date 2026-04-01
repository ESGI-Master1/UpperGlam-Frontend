import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyShortcutsRequest, saveMyShortcutsRequest } from '@/api/users';
import { ProviderTag } from '@/types/provider';

const STORAGE_KEYS = {
  recentInstituteIds: 'upperglam.recent_institute_ids',
  lastSearchParams: 'upperglam.last_search_params',
} as const;

const MAX_RECENT_INSTITUTES = 6;
const SUPPORTED_PROVIDER_TAGS: ProviderTag[] = ['hair', 'makeup', 'nails', 'skincare', 'barber'];

export interface LastSearchParams {
  query?: string;
  tags: ProviderTag[];
  location?: string;
  date?: string;
  updatedAt: string;
}

interface SaveLastSearchParamsInput {
  query?: string;
  tags: ProviderTag[];
  location?: string;
  date?: string;
}

interface ShortcutsState {
  recentInstituteIds: string[];
  lastSearchParams: LastSearchParams | null;
}

const safeJsonParse = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const normalizeTags = (input: unknown): ProviderTag[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((tag): tag is ProviderTag => {
    return typeof tag === 'string' && SUPPORTED_PROVIDER_TAGS.includes(tag as ProviderTag);
  });
};

const readLocalShortcuts = async (): Promise<ShortcutsState> => {
  try {
    const [rawRecentIds, rawLastSearch] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.recentInstituteIds),
      AsyncStorage.getItem(STORAGE_KEYS.lastSearchParams),
    ]);

    const recentIdsParsed = safeJsonParse<string[]>(rawRecentIds);
    const lastSearchParsed = safeJsonParse<LastSearchParams>(rawLastSearch);

    return {
      recentInstituteIds: Array.isArray(recentIdsParsed)
        ? recentIdsParsed.map((id) => String(id))
        : [],
      lastSearchParams: lastSearchParsed
        ? {
            query: typeof lastSearchParsed.query === 'string' ? lastSearchParsed.query : undefined,
            location:
              typeof lastSearchParsed.location === 'string' ? lastSearchParsed.location : undefined,
            date: typeof lastSearchParsed.date === 'string' ? lastSearchParsed.date : undefined,
            tags: normalizeTags(lastSearchParsed.tags),
            updatedAt:
              typeof lastSearchParsed.updatedAt === 'string'
                ? lastSearchParsed.updatedAt
                : new Date().toISOString(),
          }
        : null,
    };
  } catch {
    return {
      recentInstituteIds: [],
      lastSearchParams: null,
    };
  }
};

const writeLocalShortcuts = async (state: ShortcutsState): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.setItem(
        STORAGE_KEYS.recentInstituteIds,
        JSON.stringify(state.recentInstituteIds.slice(0, MAX_RECENT_INSTITUTES))
      ),
      AsyncStorage.setItem(STORAGE_KEYS.lastSearchParams, JSON.stringify(state.lastSearchParams)),
    ]);
  } catch {
    // no-op: local shortcuts are non-critical
  }
};

const readRemoteShortcuts = async (): Promise<ShortcutsState | null> => {
  try {
    const remote = await getMyShortcutsRequest();
    const normalized: ShortcutsState = {
      recentInstituteIds: Array.isArray(remote.recentProviderIds)
        ? remote.recentProviderIds.map((id) => String(id))
        : [],
      lastSearchParams: remote.lastSearch
        ? {
            query:
              typeof remote.lastSearch.query === 'string' ? remote.lastSearch.query : undefined,
            location:
              typeof remote.lastSearch.location === 'string'
                ? remote.lastSearch.location
                : undefined,
            date: typeof remote.lastSearch.date === 'string' ? remote.lastSearch.date : undefined,
            tags: normalizeTags(remote.lastSearch.tags),
            updatedAt:
              typeof remote.lastSearch.updatedAt === 'string'
                ? remote.lastSearch.updatedAt
                : new Date().toISOString(),
          }
        : null,
    };

    await writeLocalShortcuts(normalized);
    return normalized;
  } catch {
    return null;
  }
};

const saveRemoteShortcuts = async (state: ShortcutsState): Promise<void> => {
  try {
    await saveMyShortcutsRequest({
      recentProviderIds: state.recentInstituteIds.map((id) => {
        const numericId = Number(id);
        return Number.isInteger(numericId) ? numericId : id;
      }),
      lastSearch: state.lastSearchParams,
    });
  } catch {
    // no-op: backend sync is best-effort
  }
};

const getShortcutsState = async (): Promise<ShortcutsState> => {
  const remoteState = await readRemoteShortcuts();
  if (remoteState) {
    return remoteState;
  }
  return readLocalShortcuts();
};

const persistShortcutsState = async (state: ShortcutsState): Promise<void> => {
  await writeLocalShortcuts(state);
  await saveRemoteShortcuts(state);
};

export const getRecentInstituteIds = async (): Promise<string[]> => {
  const state = await getShortcutsState();
  return state.recentInstituteIds;
};

export const pushRecentInstituteId = async (providerId: string): Promise<void> => {
  const state = await getShortcutsState();
  const nextRecentIds = [
    providerId,
    ...state.recentInstituteIds.filter((id) => id !== providerId),
  ].slice(0, MAX_RECENT_INSTITUTES);

  await persistShortcutsState({
    ...state,
    recentInstituteIds: nextRecentIds,
  });
};

export const getLastSearchParams = async (): Promise<LastSearchParams | null> => {
  const state = await getShortcutsState();
  return state.lastSearchParams;
};

export const saveLastSearchParams = async (input: SaveLastSearchParamsInput): Promise<void> => {
  const query = input.query?.trim();
  const location = input.location?.trim();
  const date = input.date?.trim();
  const tags = normalizeTags(input.tags);

  const hasQuery = Boolean(query);
  const hasTags = tags.length > 0;
  const hasLocation = Boolean(location);
  const hasDate = Boolean(date);

  if (!hasQuery && !hasTags && !hasLocation && !hasDate) {
    return;
  }

  const state = await getShortcutsState();
  const nextLastSearch: LastSearchParams = {
    query,
    tags,
    location,
    date,
    updatedAt: new Date().toISOString(),
  };

  await persistShortcutsState({
    ...state,
    lastSearchParams: nextLastSearch,
  });
};
