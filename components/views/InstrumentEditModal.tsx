"use client";
import { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstrumentCategory, INSTRUMENT_CATEGORIES, DependencyRule } from "@/types";

interface InstrumentEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    instrumentId: string;
    instrumentName: string;
    instrumentCategory: InstrumentCategory;
    onUpdate: (id: string, name: string, oldName: string, category: InstrumentCategory) => Promise<void>;
    onAddDependency: (
        triggerCategory: InstrumentCategory,
        triggerName: string,
        targetCategory: InstrumentCategory,
        targetName: string,
    ) => Promise<void>;
    onDeleteDependency: (id: string) => Promise<void>;
    categories: Record<InstrumentCategory, string[]>;
    allDependencies: DependencyRule[];
    showToast: (msg: string, type?: "success" | "error") => void;
}

export function InstrumentEditModal({
    isOpen,
    onClose,
    instrumentId,
    instrumentName,
    instrumentCategory,
    onUpdate,
    onAddDependency,
    onDeleteDependency,
    categories,
    allDependencies,
    showToast,
}: InstrumentEditModalProps) {
    const [name, setName] = useState(instrumentName);
    const [updating, setUpdating] = useState(false);
    const [targetCategory, setTargetCategory] = useState<InstrumentCategory>(INSTRUMENT_CATEGORIES[0]);
    const [targetName, setTargetName] = useState("");
    const [addingDependency, setAddingDependency] = useState(false);
    const [deletingDependencyId, setDeletingDependencyId] = useState<string | null>(null);

    useEffect(() => {
        setName(instrumentName);
        const targetOpts = categories[targetCategory] ?? [];
        if (targetOpts.length > 0) {
            setTargetName(targetOpts[0]);
        }
    }, [isOpen, instrumentName, instrumentCategory, targetCategory, categories]);

    const targetOptions = categories[targetCategory] ?? [];

    // Get dependencies for this instrument
    const relatedDependencies = allDependencies.filter(
        (rule) =>
            (rule.triggerCategory === instrumentCategory && rule.triggerName === instrumentName) ||
            (rule.targetCategory === instrumentCategory && rule.targetName === instrumentName)
    );

    const handleUpdateName = async () => {
        if (!name.trim() || name === instrumentName) return;
        setUpdating(true);
        try {
            await onUpdate(instrumentId, name.trim(), instrumentName, instrumentCategory);
            showToast("楽器名を更新しました");
        } catch (e) {
            showToast((e as Error).message, "error");
        } finally {
            setUpdating(false);
        }
    };

    const handleAddDependency = async () => {
        if (!targetName) return;
        if (instrumentCategory === targetCategory && instrumentName === targetName) {
            showToast("同じ楽器同士の連動は設定できません", "error");
            return;
        }
        setAddingDependency(true);
        try {
            await onAddDependency(instrumentCategory, name.trim(), targetCategory, targetName);
            showToast("連動ルールを追加しました");
        } catch (e) {
            showToast((e as Error).message, "error");
        } finally {
            setAddingDependency(false);
        }
    };

    const handleDeleteDependency = async (depId: string) => {
        setDeletingDependencyId(depId);
        try {
            await onDeleteDependency(depId);
            showToast("連動ルールを削除しました");
        } catch (e) {
            showToast((e as Error).message, "error");
        } finally {
            setDeletingDependencyId(null);
        }
    };

    const updateTargetCategory = (value: InstrumentCategory) => {
        setTargetCategory(value);
        const nextName = categories[value]?.[0] ?? "";
        setTargetName(nextName);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="楽器を編集" wide>
            <div className="space-y-6">
                {/* 楽器名編集 */}
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader>
                        <CardTitle className="text-base">楽器名</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleUpdateName()}
                                placeholder="楽器名"
                                className="flex-1"
                            />
                            <Button
                                onClick={handleUpdateName}
                                disabled={updating || !name.trim() || name === instrumentName}
                            >
                                {updating ? "更新中..." : "変更"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* リレーション追加 */}
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader>
                        <CardTitle className="text-base">連動ルールを追加</CardTitle>
                        <CardDescription>この楽器が選ばれた時に自動で選ばれる楽器を指定します</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid gap-3">
                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-zinc-400">自動で選ばれる楽器のカテゴリ</label>
                                <select
                                    value={targetCategory}
                                    onChange={(e) => updateTargetCategory(e.target.value as InstrumentCategory)}
                                    className="h-10 rounded-md border border-zinc-600 bg-zinc-900 px-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                                >
                                    {INSTRUMENT_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-zinc-400">楽器名</label>
                                <select
                                    value={targetName}
                                    onChange={(e) => setTargetName(e.target.value)}
                                    className="h-10 rounded-md border border-zinc-600 bg-zinc-900 px-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
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

                            <Button
                                onClick={handleAddDependency}
                                disabled={addingDependency || !targetName}
                                className="w-full"
                            >
                                <Plus size={15} />
                                {addingDependency ? "追加中..." : "ルールを追加"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 関連リレーション表示 */}
                <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader>
                        <CardTitle className="text-base">関連する連動ルール</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {relatedDependencies.length === 0 ? (
                            <p className="text-sm text-zinc-500">連動ルールはありません</p>
                        ) : (
                            <div className="space-y-2">
                                {relatedDependencies.map((rule) => {
                                    const isThis = rule.triggerCategory === instrumentCategory && rule.triggerName === instrumentName;
                                    return (
                                        <div
                                            key={rule.id}
                                            className="flex items-center justify-between gap-3 rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-3"
                                        >
                                            <div className="flex-1 min-w-0">
                                                {isThis ? (
                                                    <p className="text-sm text-zinc-300">
                                                        <span className="font-medium">{rule.triggerName}</span>
                                                        <span className="text-zinc-500"> → </span>
                                                        <span>{rule.targetCategory} / {rule.targetName}</span>
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-zinc-300">
                                                        <span>{rule.triggerCategory} / {rule.triggerName}</span>
                                                        <span className="text-zinc-500"> → </span>
                                                        <span className="font-medium">{rule.targetName}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                onClick={() => handleDeleteDependency(rule.id)}
                                                disabled={deletingDependencyId === rule.id}
                                                variant="ghost"
                                                size="icon"
                                                className="text-zinc-500 hover:text-red-400 hover:bg-red-900/20 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Modal>
    );
}
