"use client";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { InstrumentCategory, INSTRUMENT_CATEGORIES } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface InstrumentsManageViewProps {
    showToast: (msg: string, type?: "success" | "error") => void;
}

export function InstrumentsManageView({ showToast }: InstrumentsManageViewProps) {
    const {
        categories,
        instrumentsWithId,
        dependencyRules,
        addInstrument,
        deleteInstrument,
        addDependencyRule,
        deleteDependencyRule,
    } = useStore();
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState<InstrumentCategory>(INSTRUMENT_CATEGORIES[0]);
    const [adding, setAdding] = useState(false);
    const [triggerCategory, setTriggerCategory] = useState<InstrumentCategory>(INSTRUMENT_CATEGORIES[0]);
    const [triggerName, setTriggerName] = useState("");
    const [targetCategory, setTargetCategory] = useState<InstrumentCategory>(INSTRUMENT_CATEGORIES[0]);
    const [targetName, setTargetName] = useState("");
    const [savingRule, setSavingRule] = useState(false);

    const triggerOptions = useMemo(() => categories[triggerCategory] ?? [], [categories, triggerCategory]);
    const targetOptions = useMemo(() => categories[targetCategory] ?? [], [categories, targetCategory]);

    const dependencySummary = useMemo(
        () =>
            dependencyRules.map((rule) => ({
                ...rule,
                label: `${rule.triggerCategory} / ${rule.triggerName} → ${rule.targetCategory} / ${rule.targetName}`,
            })),
        [dependencyRules]
    );

    const handleAdd = async () => {
        if (!newName.trim()) return;
        setAdding(true);
        try {
            await addInstrument(newName.trim(), newCategory);
            showToast("楽器を追加しました");
            setNewName("");
        } catch (e) {
            showToast((e as Error).message, "error");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (cat: InstrumentCategory, name: string) => {
        if (!window.confirm(`「${name}」を削除しますか？\n登録済みの曲からも削除されます。`)) return;
        const inst = instrumentsWithId.find((i) => i.name === name && i.category === cat);
        if (!inst) return;
        try {
            await deleteInstrument(inst.id, name, cat);
            showToast("楽器を削除しました");
        } catch (e) {
            showToast((e as Error).message, "error");
        }
    };

    const handleAddDependencyRule = async () => {
        if (!selectedTriggerName || !selectedTargetName) return;
        if (triggerCategory === targetCategory && selectedTriggerName === selectedTargetName) {
            showToast("同じ楽器同士の連動は設定できません", "error");
            return;
        }

        setSavingRule(true);
        try {
            await addDependencyRule(triggerCategory, selectedTriggerName, targetCategory, selectedTargetName);
            showToast("連動ルールを追加しました");
        } catch (e) {
            showToast((e as Error).message, "error");
        } finally {
            setSavingRule(false);
        }
    };

    const handleDeleteDependencyRule = async (id: string) => {
        try {
            await deleteDependencyRule(id);
            showToast("連動ルールを削除しました");
        } catch (e) {
            showToast((e as Error).message, "error");
        }
    };

    const updateTriggerCategory = (value: InstrumentCategory) => {
        setTriggerCategory(value);
        const nextName = categories[value]?.[0] ?? "";
        setTriggerName(nextName);
    };

    const updateTargetCategory = (value: InstrumentCategory) => {
        setTargetCategory(value);
        const nextName = categories[value]?.[0] ?? "";
        setTargetName(nextName);
    };

    const selectedTriggerName = triggerName || triggerOptions[0] || "";
    const selectedTargetName = targetName || targetOptions[0] || "";

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>楽器を追加</CardTitle>
                    <CardDescription>カテゴリを選んで楽器名を入力</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                        <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value as InstrumentCategory)}
                            className="h-10 bg-white border border-zinc-300 rounded-md px-3 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                        >
                            {INSTRUMENT_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            placeholder="楽器名"
                            className="flex-1 basis-48"
                        />
                        <Button
                            onClick={handleAdd}
                            disabled={adding || !newName.trim()}
                        >
                            <Plus size={15} />
                            追加
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {INSTRUMENT_CATEGORIES.map((cat) => {
                const insts = categories[cat] ?? [];
                return (
                    <Card key={cat}>
                        <CardHeader>
                            <CardTitle>
                                {cat} <span className="text-xs text-zinc-500">({insts.length})</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {insts.length === 0 ? (
                                <p className="text-zinc-600 text-sm">なし</p>
                            ) : (
                                <div className="space-y-2">
                                    {insts.map((inst) => (
                                        <div
                                            key={inst}
                                            className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2"
                                        >
                                            <span className="text-sm text-zinc-900">{inst}</span>
                                            <Button
                                                onClick={() => handleDelete(cat, inst)}
                                                variant="ghost"
                                                size="icon"
                                                className="text-zinc-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}

            <Card>
                <CardHeader>
                    <CardTitle>連動ルール</CardTitle>
                    <CardDescription>この楽器を選んだら、こちらも自動で選ばれる関係を作れます</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-zinc-500">きっかけ</label>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <select
                                    value={triggerCategory}
                                    onChange={(e) => updateTriggerCategory(e.target.value as InstrumentCategory)}
                                    className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                                >
                                    {INSTRUMENT_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedTriggerName}
                                    onChange={(e) => setTriggerName(e.target.value)}
                                    className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                                >
                                    {triggerOptions.length === 0 ? (
                                        <option value="">楽器がありません</option>
                                    ) : (
                                        triggerOptions.map((inst) => (
                                            <option key={inst} value={inst}>
                                                {inst}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center justify-center text-zinc-400 text-sm font-medium pb-2">
                            →
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-zinc-500">自動で選ばれる</label>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <select
                                    value={targetCategory}
                                    onChange={(e) => updateTargetCategory(e.target.value as InstrumentCategory)}
                                    className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                                >
                                    {INSTRUMENT_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedTargetName}
                                    onChange={(e) => setTargetName(e.target.value)}
                                    className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                                >
                                    {targetOptions.length === 0 ? (
                                        <option value="">楽器がありません</option>
                                    ) : (
                                        targetOptions.map((inst) => (
                                            <option key={inst} value={inst}>
                                                {inst}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleAddDependencyRule}
                            disabled={savingRule || !selectedTriggerName || !selectedTargetName}
                        >
                            <Plus size={15} />
                            ルールを追加
                        </Button>
                    </div>

                    {dependencySummary.length === 0 ? (
                        <p className="text-sm text-zinc-500">まだ連動ルールはありません</p>
                    ) : (
                        <div className="space-y-2">
                            {dependencySummary.map((rule) => (
                                <div
                                    key={rule.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
                                >
                                    <p className="text-sm text-zinc-900">{rule.label}</p>
                                    <Button
                                        onClick={() => handleDeleteDependencyRule(rule.id)}
                                        variant="ghost"
                                        size="icon"
                                        className="text-zinc-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}