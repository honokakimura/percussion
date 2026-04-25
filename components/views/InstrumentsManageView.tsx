"use client";
import { useState } from "react";
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
    const { categories, instrumentsWithId, addInstrument, deleteInstrument } = useStore();
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState<InstrumentCategory>(INSTRUMENT_CATEGORIES[0]);
    const [adding, setAdding] = useState(false);

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
                            className="flex-1 min-w-[190px]"
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
        </div>
    );
}