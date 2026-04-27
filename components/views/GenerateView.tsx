"use client";
import { useMemo, useState } from "react";
import { Copy, Check, Music2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { INSTRUMENT_CATEGORIES, TRANSPORT_FOOTER } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface GenerateViewProps {
    showToast: (msg: string, type?: "success" | "error") => void;
}

export function GenerateView({ showToast }: GenerateViewProps) {
    const { songs, categories, alwaysCarryInstruments } = useStore();
    const songsList = useMemo(() => (Array.isArray(songs) ? songs : []), [songs]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [tempOverrides, setTempOverrides] = useState<Record<string, boolean>>({});
    const [includeAlwaysCarry, setIncludeAlwaysCarry] = useState(true);
    const [copied, setCopied] = useState(false);

    const baseChecked = useMemo(() => {
        const next: Record<string, boolean> = {};
        for (const cat of INSTRUMENT_CATEGORIES) {
            for (const inst of categories[cat] ?? []) {
                next[`${cat}::${inst}`] = false;
            }
        }
        if (includeAlwaysCarry) {
            for (const cat of INSTRUMENT_CATEGORIES) {
                for (const inst of alwaysCarryInstruments[cat] ?? []) {
                    next[`${cat}::${inst}`] = true;
                }
            }
        }
        for (const id of selectedIds) {
            const song = songsList.find((s) => s.id === id);
            if (!song) continue;
            for (const cat of INSTRUMENT_CATEGORIES) {
                for (const inst of song.instruments[cat] ?? []) {
                    next[`${cat}::${inst}`] = true;
                }
            }
        }
        return next;
    }, [alwaysCarryInstruments, categories, includeAlwaysCarry, selectedIds, songsList]);

    const checkedMap = useMemo(
        () => ({ ...baseChecked, ...tempOverrides }),
        [baseChecked, tempOverrides]
    );

    const toggleSong = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        setTempOverrides({});
    };

    const generateMessage = () => {
        const lines: string[] = [];
        lines.push("名前: 打楽器");

        const selectedNames = songsList.filter((s) => selectedIds.has(s.id)).map((s) => s.name);
        lines.push("楽器名称:");

        for (const cat of INSTRUMENT_CATEGORIES) {
            const items = (categories[cat] ?? []).filter((inst) => checkedMap[`${cat}::${inst}`]);
            if (items.length > 0) {
                lines.push(`〇${cat}`);
                for (const item of items) lines.push(`  ${item}`);
                lines.push("");
            }
        }

        lines.push(TRANSPORT_FOOTER);
        return lines.join("\n");
    };

    const handleCopy = async () => {
        const text = generateMessage();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        showToast("コピーしました！");
        setTimeout(() => setCopied(false), 2000);
    };

    const hasSelected = selectedIds.size > 0;
    const message = hasSelected ? generateMessage() : "";

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>1. 曲を選択</CardTitle>
                    <CardDescription>複数選択できます</CardDescription>
                </CardHeader>
                <CardContent>
                    {songsList.length === 0 ? (
                        <div className="text-center py-10 text-zinc-500 text-sm bg-zinc-50 border border-zinc-200 rounded-xl">
                            曲が登録されていません。「曲の管理」から追加してください。
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {songsList.map((song) => {
                                const isSelected = selectedIds.has(song.id);
                                const count = Object.values(song.instruments).flat().length;
                                return (
                                    <label
                                        key={song.id}
                                        className={`flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl border text-left transition-colors cursor-pointer ${isSelected
                                            ? "bg-zinc-50 border-zinc-900 text-zinc-900"
                                            : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSong(song.id)}
                                                aria-label={`${song.name} を選択`}
                                            />
                                            <span className="font-medium">{song.name}</span>
                                        </div>
                                        <span className="text-xs text-zinc-500">{count}種</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {hasSelected && (
                <Card>
                    <CardHeader>
                        <CardTitle>2. 楽器を調整</CardTitle>
                        <CardDescription>必要なものだけONにしてください</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <label className="mb-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                            <Checkbox
                                checked={includeAlwaysCarry}
                                onCheckedChange={(checked) => {
                                    setIncludeAlwaysCarry(checked === true);
                                    setTempOverrides({});
                                }}
                                aria-label="常時運搬セットを含める"
                            />
                            常時運搬セットを含める
                        </label>
                        <div className="space-y-4">
                            {INSTRUMENT_CATEGORIES.map((cat) => {
                                const insts = categories[cat] ?? [];
                                if (insts.length === 0) return null;
                                return (
                                    <div key={cat}>
                                        <p className="text-xs font-medium text-zinc-500 mb-2">{cat}</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {insts.map((inst) => {
                                                const key = `${cat}::${inst}`;
                                                const on = checkedMap[key] ?? false;
                                                return (
                                                    <label
                                                        key={key}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${on
                                                            ? "bg-zinc-50 border border-zinc-300 text-zinc-900"
                                                            : "bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-700"
                                                            }`}
                                                    >
                                                        <Checkbox
                                                            checked={on}
                                                            onCheckedChange={() =>
                                                                setTempOverrides((p) => ({
                                                                    ...p,
                                                                    [key]: !(checkedMap[key] ?? false),
                                                                }))
                                                            }
                                                            aria-label={`${inst} を切り替え`}
                                                        />
                                                        {inst}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {hasSelected && (
                <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                        <div className="flex items-center justify-between mb-3 gap-3">
                            <h2 className="text-sm font-semibold text-zinc-900">3. メッセージをコピー</h2>
                            <Button
                                onClick={handleCopy}
                                variant={copied ? "secondary" : "default"}
                                className="shrink-0"
                            >
                                {copied ? <Check size={15} /> : <Copy size={15} />}
                                {copied ? "コピー済み" : "コピー"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm text-zinc-700 font-mono whitespace-pre-wrap leading-relaxed">
                            {message}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {!hasSelected && songsList.length > 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3 pt-4">
                        <Music2 size={40} strokeWidth={1} />
                        <p className="text-sm">曲を選択してメッセージを生成</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}