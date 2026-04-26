import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InstrumentCategory } from "@/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const instrument = await prisma.instrument.findUnique({ where: { id } });
    if (!instrument) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get all dependency rules where this instrument is trigger or target
    const relations = await prisma.instrumentDependency.findMany({
      where: {
        OR: [
          { triggerCategory: instrument.category, triggerName: instrument.name },
          { targetCategory: instrument.category, targetName: instrument.name },
        ],
      },
    });

    return NextResponse.json({ instrument, relations });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch instrument" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name } = body as { name?: string };

    if (!name?.trim()) {
      return NextResponse.json({ error: "楽器名は必須です" }, { status: 400 });
    }

    const instrument = await prisma.instrument.findUnique({ where: { id } });
    if (!instrument) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if new name already exists in same category
    if (name.trim() !== instrument.name) {
      const existing = await prisma.instrument.findUnique({
        where: { name_category: { name: name.trim(), category: instrument.category } },
      });
      if (existing) {
        return NextResponse.json({ error: "すでに登録されています" }, { status: 409 });
      }
    }

    // Update instrument name
    const updated = await prisma.instrument.update({
      where: { id },
      data: { name: name.trim() },
    });

    // Update all songs that reference this instrument
    const songs = await prisma.song.findMany();
    for (const song of songs) {
      const instruments = song.instruments as Record<string, string[]>;
      const cat = instrument.category as InstrumentCategory;
      if (instruments[cat]) {
        const idx = instruments[cat].indexOf(instrument.name);
        if (idx !== -1) {
          instruments[cat][idx] = name.trim();
          await prisma.song.update({ where: { id: song.id }, data: { instruments } });
        }
      }
    }

    // Update all dependency rules that reference this instrument
    await prisma.instrumentDependency.updateMany({
      where: {
        triggerCategory: instrument.category,
        triggerName: instrument.name,
      },
      data: { triggerName: name.trim() },
    });

    await prisma.instrumentDependency.updateMany({
      where: {
        targetCategory: instrument.category,
        targetName: instrument.name,
      },
      data: { targetName: name.trim() },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update instrument" }, { status: 500 });
  }
}

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

    await prisma.instrumentDependency.deleteMany({
      where: {
        OR: [
          { triggerCategory: instrument.category, triggerName: instrument.name },
          { targetCategory: instrument.category, targetName: instrument.name },
        ],
      },
    });

    await prisma.instrument.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete instrument" }, { status: 500 });
  }
}