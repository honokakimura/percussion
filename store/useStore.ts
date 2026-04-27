"use client";
import { create } from "zustand";
import { Song, InstrumentCategory, DependencyRule, InstrumentCategoryItem } from "@/types";

interface StoreState {
    songs: Song[];
    categories: Record<InstrumentCategory, string[]>;
    availableCategories: InstrumentCategoryItem[];
    dependencyRules: DependencyRule[];
    alwaysCarryInstruments: Song["instruments"];
    loaded: boolean;

    // Actions
    fetchAll: () => Promise<void>;

    // Songs
    addSong: (name: string, instruments: Song["instruments"]) => Promise<void>;
    updateSong: (id: string, name: string, instruments: Song["instruments"]) => Promise<void>;
    deleteSong: (id: string) => Promise<void>;
    updateAlwaysCarryInstruments: (instruments: Song["instruments"]) => Promise<void>;

    // Instruments
    addInstrument: (name: string, category: InstrumentCategory) => Promise<void>;
    updateInstrument: (
        id: string,
        nextName: string,
        nextCategory: InstrumentCategory,
        prevName: string,
        prevCategory: InstrumentCategory,
    ) => Promise<void>;
    deleteInstrument: (id: string, name: string, category: InstrumentCategory) => Promise<void>;

    // Categories
    addCategory: (name: string) => Promise<void>;
    updateCategory: (id: string, payload: { name?: string; order?: number }) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;

    // Dependency rules
    addDependencyRule: (
        triggerCategory: InstrumentCategory,
        triggerName: string,
        targetCategory: InstrumentCategory,
        targetName: string,
    ) => Promise<void>;
    deleteDependencyRule: (id: string) => Promise<void>;

    // Raw instrument list with IDs (for delete)
    instrumentsWithId: { id: string; name: string; category: string }[];
}

function buildCategoryMap(
    availableCategories: InstrumentCategoryItem[],
    rawInstruments: Record<string, string[]>,
): Record<InstrumentCategory, string[]> {
    const map: Record<string, string[]> = {};

    for (const category of availableCategories) {
        map[category.name] = Array.isArray(rawInstruments[category.name]) ? rawInstruments[category.name] : [];
    }

    for (const [name, instruments] of Object.entries(rawInstruments)) {
        if (!Array.isArray(instruments)) continue;
        if (!map[name]) map[name] = instruments;
    }

    return map;
}

export const useStore = create<StoreState>((set) => ({
    songs: [],
    categories: {},
    availableCategories: [],
    dependencyRules: [],
    alwaysCarryInstruments: {},
    loaded: false,
    instrumentsWithId: [],

    fetchAll: async () => {
        const [songsRes, instrumentsRes, alwaysCarryRes, categoriesRes] = await Promise.all([
            fetch("/api/songs"),
            fetch("/api/instruments"),
            fetch("/api/always-carry"),
            fetch("/api/instrument-categories"),
        ]);
        const dependencyRulesRes = await fetch("/api/instrument-dependencies");
        const songsJson: unknown = await songsRes.json();
        const instrumentsJson: unknown = await instrumentsRes.json();
        const alwaysCarryJson: unknown = await alwaysCarryRes.json();
        const dependencyRulesJson: unknown = await dependencyRulesRes.json();
        const categoriesJson: unknown = await categoriesRes.json();

        const songs: Song[] = Array.isArray(songsJson) ? (songsJson as Song[]) : [];
        const rawInstruments: Record<string, string[]> =
            instrumentsJson && typeof instrumentsJson === "object"
                ? (instrumentsJson as Record<string, string[]>)
                : {};
        const dependencyRules: DependencyRule[] = Array.isArray(dependencyRulesJson)
            ? (dependencyRulesJson as DependencyRule[])
            : [];
        const availableCategories: InstrumentCategoryItem[] = Array.isArray(categoriesJson)
            ? (categoriesJson as InstrumentCategoryItem[])
                .filter((item) => item && typeof item.name === "string" && item.name.trim().length > 0)
                .sort((a, b) => a.order - b.order)
            : [];
        const alwaysCarryInstruments: Song["instruments"] =
            alwaysCarryJson && typeof alwaysCarryJson === "object"
                ? (alwaysCarryJson as Song["instruments"])
                : {};

        // Also fetch raw list with IDs for delete
        const instWithIdRes = await fetch("/api/instruments?withId=1");
        let instrumentsWithId: { id: string; name: string; category: string }[] = [];
        if (instWithIdRes.ok) {
            const withIdJson: unknown = await instWithIdRes.json();
            if (Array.isArray(withIdJson)) {
                instrumentsWithId = withIdJson as { id: string; name: string; category: string }[];
            }
        }

        const categories = buildCategoryMap(availableCategories, rawInstruments);

        set({
            songs,
            categories,
            availableCategories,
            dependencyRules,
            alwaysCarryInstruments,
            loaded: true,
            instrumentsWithId,
        });
    },

    addSong: async (name, instruments) => {
        const res = await fetch("/api/songs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, instruments }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const song: Song = await res.json();
        set((s) => ({ songs: [...s.songs, song] }));
    },

    updateSong: async (id, name, instruments) => {
        const res = await fetch(`/api/songs/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, instruments }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const updated: Song = await res.json();
        set((s) => ({ songs: s.songs.map((song) => (song.id === id ? updated : song)) }));
    },

    deleteSong: async (id) => {
        const res = await fetch(`/api/songs/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json()).error);
        set((s) => ({ songs: s.songs.filter((song) => song.id !== id) }));
    },

    updateAlwaysCarryInstruments: async (instruments) => {
        const res = await fetch("/api/always-carry", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instruments }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        set({ alwaysCarryInstruments: instruments });
    },

    addInstrument: async (name, category) => {
        const res = await fetch("/api/instruments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, category }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        await useStore.getState().fetchAll();
    },

    updateInstrument: async (id, nextName, nextCategory, prevName, prevCategory) => {
        const payload: { name?: string; category?: string } = {};
        if (nextName !== prevName) payload.name = nextName;
        if (nextCategory !== prevCategory) payload.category = nextCategory;

        const res = await fetch(`/api/instruments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        await useStore.getState().fetchAll();
    },

    deleteInstrument: async (id, name, category) => {
        const res = await fetch(`/api/instruments/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json()).error);
        await useStore.getState().fetchAll();
    },

    addCategory: async (name) => {
        const res = await fetch("/api/instrument-categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        await useStore.getState().fetchAll();
    },

    updateCategory: async (id, payload) => {
        const res = await fetch(`/api/instrument-categories/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        await useStore.getState().fetchAll();
    },

    deleteCategory: async (id) => {
        const res = await fetch(`/api/instrument-categories/${id}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error((await res.json()).error);
        await useStore.getState().fetchAll();
    },

    addDependencyRule: async (triggerCategory, triggerName, targetCategory, targetName) => {
        const res = await fetch("/api/instrument-dependencies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ triggerCategory, triggerName, targetCategory, targetName }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const rule: DependencyRule = await res.json();
        set((s) => ({ dependencyRules: [...s.dependencyRules, rule] }));
    },

    deleteDependencyRule: async (id) => {
        const res = await fetch(`/api/instrument-dependencies/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json()).error);
        set((s) => ({ dependencyRules: s.dependencyRules.filter((rule) => rule.id !== id) }));
    },
}));