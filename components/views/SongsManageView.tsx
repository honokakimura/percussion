"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Song } from "@/types";
import { SongEditModal } from "./SongEditModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SongsManageViewProps {
    showToast: (msg: string, type?: "success" | "error") => void;
}

export function SongsManageView({ showToast }: SongsManageViewProps) {
    const { songs, addSong, updateSong, deleteSong } = useStore();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);

    const handleSave = async (name: string, instruments: Song["instruments"]) => {
        try {
            if (editingSong) {
                await updateSong(editingSong.id, name, instruments);
                showToast("曲を更新しました");
            } else {
                await addSong(name, instruments);
                showToast("曲を追加しました");
            }
        } catch (e) {
            showToast((e as Error).message, "error");
        }
    };

    const handleDelete = async (song: Song) => {
        if (!window.confirm(`「${song.name}」を削除しますか？`)) return;
        try {
            await deleteSong(song.id);
            showToast("曲を削除しました");
        } catch (e) {
            showToast((e as Error).message, "error");
        }
    };

    const openAdd = () => {
        setEditingSong(null);
        setModalOpen(true);
    };

    const openEdit = (song: Song) => {
        setEditingSong(song);
        setModalOpen(true);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>曲の管理</CardTitle>
                        <CardDescription className="mt-1">登録済み {songs.length} 曲</CardDescription>
                    </div>
                    <Button
                        onClick={openAdd}
                    >
                        <Plus size={15} />
                        追加
                    </Button>
                </CardHeader>
            </Card>

            {songs.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-16 text-zinc-500 text-sm pt-4">
                        曲がまだ登録されていません
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {songs.map((song) => {
                        const count = Object.values(song.instruments).flat().length;
                        return (
                            <Card key={song.id}>
                                <CardContent className="flex items-center justify-between px-4 py-3">
                                    <div>
                                        <p className="font-medium text-zinc-900">{song.name}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">楽器 {count} 種</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            onClick={() => openEdit(song)}
                                            variant="ghost"
                                            size="icon"
                                            className="text-zinc-500 hover:text-zinc-900"
                                        >
                                            <Pencil size={16} />
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(song)}
                                            variant="ghost"
                                            size="icon"
                                            className="text-zinc-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <SongEditModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                song={editingSong}
                onSave={handleSave}
            />
        </div>
    );
}