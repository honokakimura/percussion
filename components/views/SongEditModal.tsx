"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Song, InstrumentCategory } from "@/types";
import { useStore } from "@/store/useStore";
import { BULK_SELECT_CATEGORY_NAME } from "@/lib/constants";

interface SongEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    song?: Song | null;
    onSave: (name: string, instruments: Song["instruments"]) => Promise<void>;
}

function buildInitialChecked(
    availableCategoryNames: InstrumentCategory[],
    categories: ReturnType<typeof useStore.getState>["categories"],
    song?: Song | null
) {
    const initial: Record<string, boolean> = {};
    for (const cat of availableCategoryNames) {
        for (const inst of categories[cat] ?? []) {
            initial[`${cat}::${inst}`] = song?.instruments[cat]?.includes(inst) ?? false;
        }
    }
    return initial;
}

interface SongEditModalBodyProps {
    availableCategoryNames: InstrumentCategory[];
    categories: ReturnType<typeof useStore.getState>["categories"];
    song?: Song | null;
    onClose: () => void;
    onSave: (name: string, instruments: Song["instruments"]) => Promise<void>;
}

function SongEditModalBody({ availableCategoryNames, categories, song, onClose, onSave }: SongEditModalBodyProps) {
    const [name, setName] = useState(() => song?.name ?? "");
    const [checked, setChecked] = useState<Record<string, boolean>>(() =>
        buildInitialChecked(availableCategoryNames, categories, song)
    );
    const [saving, setSaving] = useState(false);
    const dependencyRules = useStore((s) => s.dependencyRules);

    const applyDependencyRules = (next: Record<string, boolean>, startCategory: InstrumentCategory, startName: string) => {
        const queue: Array<{ category: InstrumentCategory; name: string }> = [
            { category: startCategory, name: startName },
        ];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) continue;
            const currentKey = `${current.category}::${current.name}`;
            if (visited.has(currentKey)) continue;
            visited.add(currentKey);

            for (const rule of dependencyRules) {
                if (rule.triggerCategory === current.category && rule.triggerName === current.name) {
                    const targetKey = `${rule.targetCategory}::${rule.targetName}`;
                    if (!next[targetKey]) {
                        next[targetKey] = true;
                        queue.push({ category: rule.targetCategory, name: rule.targetName });
                    }
                }
            }
        }
    };

    const handleCheck = (cat: InstrumentCategory, inst: string, value: boolean) => {
        setChecked((prev) => {
            const next = { ...prev, [`${cat}::${inst}`]: value };
            if (value) {
                applyDependencyRules(next, cat, inst);
            }
            return next;
        });
    };

    const toggleAllDrumSet = (value: boolean) => {
        const categoryName = BULK_SELECT_CATEGORY_NAME;
        setChecked((prev) => {
            const next = { ...prev };
            for (const inst of categories[categoryName] ?? []) {
                next[`${categoryName}::${inst}`] = value;
                if (value) {
                    applyDependencyRules(next, categoryName, inst);
                }
            }
            return next;
        });
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        const instruments: Song["instruments"] = {};
        for (const cat of availableCategoryNames) {
            const selected = (categories[cat] ?? []).filter((inst) => checked[`${cat}::${inst}`]);
            if (selected.length > 0) instruments[cat] = selected;
        }
        try {
            await onSave(name.trim(), instruments);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                    曲名
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="曲名を入力"
                    className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors"
                />
            </div>

            {availableCategoryNames.map((cat) => {
                const insts = categories[cat] ?? [];
                if (insts.length === 0) return null;
                const isDrumSet = cat === BULK_SELECT_CATEGORY_NAME;
                return (
                    <div key={cat}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">{cat}</span>
                            {isDrumSet && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleAllDrumSet(true)}
                                        className="text-xs px-2 py-0.5 rounded bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
                                    >
                                        一括ON
                                    </button>
                                    <button
                                        onClick={() => toggleAllDrumSet(false)}
                                        className="text-xs px-2 py-0.5 rounded bg-zinc-200 text-zinc-700 hover:bg-zinc-300 transition-colors"
                                    >
                                        全解除
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {insts.map((inst) => {
                                const key = `${cat}::${inst}`;
                                return (
                                    <label
                                        key={key}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${checked[key]
                                            ? "bg-zinc-900/10 border border-zinc-400"
                                            : "bg-white border border-zinc-300 hover:border-zinc-500"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked[key] ?? false}
                                            onChange={(e) => handleCheck(cat, inst, e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div
                                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${checked[key] ? "bg-zinc-900" : "bg-white border border-zinc-400"
                                                }`}
                                        >
                                            {checked[key] && (
                                                <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white fill-current">
                                                    <polyline points="1.5,5 4,7.5 8.5,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-sm text-zinc-900">{inst}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                    キャンセル
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    className="px-5 py-2 rounded-lg text-sm font-medium bg-zinc-900 hover:bg-zinc-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? "保存中..." : "保存"}
                </button>
            </div>
        </div>
    );
}

export function SongEditModal({ isOpen, onClose, song, onSave }: SongEditModalProps) {
    const categories = useStore((s) => s.categories);
    const availableCategoryNames = useStore((s) => s.availableCategories.map((category) => category.name));
    const dependencyRules = useStore((s) => s.dependencyRules);
    const categoriesKey = availableCategoryNames
        .map((cat) => `${cat}:${(categories[cat] ?? []).join("|")}`)
        .join("::");
    const dependencyRulesKey = dependencyRules
        .map((rule) => `${rule.triggerCategory}:${rule.triggerName}->${rule.targetCategory}:${rule.targetName}`)
        .join("::");

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={song ? "曲を編集" : "曲を追加"} wide>
            <SongEditModalBody
                key={`${song?.id ?? "new"}::${categoriesKey}::${dependencyRulesKey}`}
                availableCategoryNames={availableCategoryNames}
                categories={categories}
                song={song}
                onClose={onClose}
                onSave={onSave}
            />
        </Modal>
    );
}