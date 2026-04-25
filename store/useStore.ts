"use client";
import { create } from "zustand";
import { Song, InstrumentCategory, INSTRUMENT_CATEGORIES } from "@/types";

interface StoreState {
    songs: Song[];
    categories: Record<InstrumentCategory, string[]>;
    loaded: boolean;

    // Actions
    fetchAll: () => Promise<void>;

    // Songs
    addSong: (name: string, instruments: Song["instruments"]) => Promise<void>;
    updateSong: (id: string, name: string, instruments: Song["instruments"]) => Promise<void>;
    deleteSong: (id: string) => Promise<void>;

    // Instruments
    addInstrument: (name: string, category: InstrumentCategory) => Promise<void>;
    deleteInstrument: (id: string, name: string, category: InstrumentCategory) => Promise<void>;

    // Raw instrument list with IDs (for delete)
    instrumentsWithId: { id: string; name: string; category: string }[];
}

export const useStore = create<StoreState>((set) => ({
    songs: [],
    categories: Object.fromEntries(INSTRUMENT_CATEGORIES.map((c) => [c, []])) as unknown as Record<InstrumentCategory, string[]>,
    loaded: false,
    instrumentsWithId: [],

    fetchAll: async () => {
        const [songsRes, instrumentsRes] = await Promise.all([
            fetch("/api/songs"),
            fetch("/api/instruments"),
        ]);
        const songsJson: unknown = await songsRes.json();
        const instrumentsJson: unknown = await instrumentsRes.json();

        const songs: Song[] = Array.isArray(songsJson) ? (songsJson as Song[]) : [];
        const rawInstruments: Partial<Record<InstrumentCategory, string[]>> =
            instrumentsJson && typeof instrumentsJson === "object"
                ? (instrumentsJson as Partial<Record<InstrumentCategory, string[]>>)
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

        const categories = Object.fromEntries(
            INSTRUMENT_CATEGORIES.map((c) => [c, Array.isArray(rawInstruments[c]) ? rawInstruments[c] : []])
        ) as Record<InstrumentCategory, string[]>;

        set({ songs, categories, loaded: true, instrumentsWithId });
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

    addInstrument: async (name, category) => {
        const res = await fetch("/api/instruments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, category }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const inst = await res.json();
        set((s) => ({
            categories: { ...s.categories, [category]: [...(s.categories[category] ?? []), name] },
            instrumentsWithId: [...s.instrumentsWithId, inst],
        }));
    },

    deleteInstrument: async (id, name, category) => {
        const res = await fetch(`/api/instruments/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json()).error);
        // Also refresh songs as they may have been modified server-side
        const songsRes = await fetch("/api/songs");
        const songsJson: unknown = await songsRes.json();
        const songs: Song[] = Array.isArray(songsJson) ? (songsJson as Song[]) : [];
        set((s) => ({
            categories: {
                ...s.categories,
                [category]: s.categories[category].filter((n) => n !== name),
            },
            instrumentsWithId: s.instrumentsWithId.filter((i) => i.id !== id),
            songs,
        }));
    },
}));