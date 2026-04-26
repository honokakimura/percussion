"use client";
import { useMemo, useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { InstrumentCategory, INSTRUMENT_CATEGORIES } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InstrumentEditModal } from "./InstrumentEditModal";

interface InstrumentsManageViewProps {
    showToast: (msg: string, type?: "success" | "error") => void;
}

export function InstrumentsManageView({ showToast }: InstrumentsManageViewProps) {
    const {
        categories,
        instrumentsWithId,
        dependencyRules,
        addInstrument,
        updateInstrument,
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

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedInstrument, setSelectedInstrument] = useState<{
        id: string;
        name: string;
        category: InstrumentCategory;
    } | null>(null);
    const [deletingInstrumentId, setDeletingInstrumentId] = useState<string | null>(null);
    const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

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

    const handleEditInstrument = (id: string, name: string, category: InstrumentCategory) => {
        setSelectedInstrument({ id, name, category });
        setEditModalOpen(true);
    };

    const handleDelete = async (cat: InstrumentCategory, name: string) => {
        if (!window.confirm(`「${name}」を削除しますか？\n登録済みの曲からも削除されます。`)) return;
        const inst = instrumentsWithId.find((i) => i.name === name && i.category === cat);
        if (!inst) return;
        setDeletingInstrumentId(inst.id);
        try {
            await deleteInstrument(inst.id, name, cat);
            showToast("楽器を削除しました");
        } catch (e) {
            showToast((e as Error).message, "error");
        } finally {
            setDeletingInstrumentId(null);
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
        setDeletingRuleId(id);
        try {
            await deleteDependencyRule(id);
            showToast("連動ルールを削除しました");
        } catch (e) {
            showToast((e as Error).message, "error");
        } finally {
            setDeletingRuleId(null);
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

    // Get relations for a specific instrument
    const getInstrumentRelations = (category: InstrumentCategory, name: string) => {
        return dependencyRules.filter(
            (rule) =>
                (rule.triggerCategory === category && rule.triggerName === name) ||
                (rule.targetCategory === category && rule.targetName === name)
        );
    };

    return (
        <div className="space-y-6">
            {/* 楽器編集モーダル */}
            {selectedInstrument && (
                <InstrumentEditModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    instrumentId={selectedInstrument.id}
                    instrumentName={selectedInstrument.name}
                    instrumentCategory={selectedInstrument.category}
                    onUpdate={updateInstrument}
                    onAddDependency={addDependencyRule}
                    onDeleteDependency={deleteDependencyRule}
                    categories={categories}
                    allDependencies={dependencyRules}
                    showToast={showToast}
                />
            )}

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
                            {adding ? "追加中..." : "追加"}
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
                                <div className="space-y-3">
                                    {insts.map((inst) => {
                                        const relations = getInstrumentRelations(cat, inst);
                                        const instData = instrumentsWithId.find((i) => i.name === inst && i.category === cat);

                                        return (
                                            <div
                                                key={inst}
                                                className="flex flex-col gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-medium text-zinc-900">{inst}</span>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <Button
                                                            onClick={() => instData && handleEditInstrument(instData.id, inst, cat)}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
                                                        >
                                                            <Edit2 size={14} />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDelete(cat, inst)}
                                                            disabled={deletingInstrumentId === instData?.id}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-zinc-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* 関連リレーション表示 */}
                                                {relations.length > 0 && (
                                                    <div className="text-xs text-zinc-600 space-y-1 pl-2 border-l-2 border-zinc-300">
                                                        {relations.map((rule) => {
                                                            const isThis = rule.triggerCategory === cat && rule.triggerName === inst;
                                                            return (
                                                                <div key={rule.id}>
                                                                    {isThis ? (
                                                                        <span>
                                                                            ← <span className="text-zinc-700 font-medium">{rule.targetCategory} / {rule.targetName}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span>
                                                                            → <span className="text-zinc-700 font-medium">{rule.targetCategory} / {rule.targetName}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
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
                            {savingRule ? "追加中..." : "ルールを追加"}
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
                                        disabled={deletingRuleId === rule.id}
                                        variant="ghost"
                                        size="icon"
                                        className="text-zinc-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
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