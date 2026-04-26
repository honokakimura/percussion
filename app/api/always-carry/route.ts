import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Song } from "@/types";
import { ALWAYS_CARRY_SONG_NAME } from "@/lib/constants";

export async function GET() {
    try {
        const entry = await prisma.song.findFirst({ where: { name: ALWAYS_CARRY_SONG_NAME } });
        const instruments = (entry?.instruments ?? {}) as Song["instruments"];
        return NextResponse.json(instruments);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch always-carry set" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { instruments } = body as { instruments?: Song["instruments"] };

        const existing = await prisma.song.findFirst({ where: { name: ALWAYS_CARRY_SONG_NAME } });
        if (existing) {
            const updated = await prisma.song.update({
                where: { id: existing.id },
                data: { instruments: instruments ?? {} },
            });
            return NextResponse.json({ instruments: updated.instruments });
        }

        const created = await prisma.song.create({
            data: { name: ALWAYS_CARRY_SONG_NAME, instruments: instruments ?? {} },
        });
        return NextResponse.json({ instruments: created.instruments }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to save always-carry set" }, { status: 500 });
    }
}
