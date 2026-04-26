import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Song } from "@/types";
import { ALWAYS_CARRY_SONG_NAME } from "@/lib/constants";

export async function GET() {
    try {
        const songs = await prisma.song.findMany({
            where: { name: { not: ALWAYS_CARRY_SONG_NAME } },
            orderBy: { createdAt: "asc" },
        });
        const result: Song[] = songs.map(
            (s: { id: string; name: string; instruments: Song["instruments"] | unknown }) => ({
                id: s.id,
                name: s.name,
                instruments: s.instruments as Song["instruments"],
            })
        );
        return NextResponse.json(result);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch songs" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, instruments } = body as { name: string; instruments: Song["instruments"] };
        if (!name?.trim()) {
            return NextResponse.json({ error: "曲名は必須です" }, { status: 400 });
        }
        if (name.trim() === ALWAYS_CARRY_SONG_NAME) {
            return NextResponse.json({ error: "この曲名は使用できません" }, { status: 400 });
        }
        const song = await prisma.song.create({
            data: { name: name.trim(), instruments: instruments ?? {} },
        });
        return NextResponse.json({ id: song.id, name: song.name, instruments: song.instruments }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create song" }, { status: 500 });
    }
}