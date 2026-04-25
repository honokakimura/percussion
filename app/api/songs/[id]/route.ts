import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Song } from "@/types";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, instruments } = body as { name: string; instruments: Song["instruments"] };
    if (!name?.trim()) {
      return NextResponse.json({ error: "曲名は必須です" }, { status: 400 });
    }
    const song = await prisma.song.update({
      where: { id },
      data: { name: name.trim(), instruments: instruments ?? {} },
    });
    return NextResponse.json({ id: song.id, name: song.name, instruments: song.instruments });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update song" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.song.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete song" }, { status: 500 });
  }
}