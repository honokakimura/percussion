import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InstrumentCategory } from "@/types";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Find instrument to get name + category
    const instrument = await prisma.instrument.findUnique({ where: { id } });
    if (!instrument) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Remove from all songs
    const songs = await prisma.song.findMany();
    for (const song of songs) {
      const instruments = song.instruments as Record<string, string[]>;
      const cat = instrument.category as InstrumentCategory;
      if (instruments[cat]) {
        instruments[cat] = instruments[cat].filter((n: string) => n !== instrument.name);
        if (instruments[cat].length === 0) delete instruments[cat];
        await prisma.song.update({ where: { id: song.id }, data: { instruments } });
      }
    }

    await prisma.instrument.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete instrument" }, { status: 500 });
  }
}