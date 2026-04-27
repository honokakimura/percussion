import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InstrumentCategory } from "@/types";

type DependencyShape = {
  id: string;
  triggerCategory: string;
  triggerName: string;
  targetCategory: string;
  targetName: string;
};

function dependencyKey(rule: Omit<DependencyShape, "id">) {
  return `${rule.triggerCategory}::${rule.triggerName}::${rule.targetCategory}::${rule.targetName}`;
}

function normalizeSongInstruments(
  instruments: unknown,
  oldCategory: string,
  oldName: string,
  newCategory: string,
  newName: string,
): Record<string, string[]> {
  const record = (instruments ?? {}) as Record<string, string[]>;
  const normalized: Record<string, string[]> = {};

  for (const [category, values] of Object.entries(record)) {
    if (!Array.isArray(values)) continue;

    let nextCategory = category;
    let nextValues = values.filter((value) => typeof value === "string" && value.trim().length > 0);

    if (category === oldCategory) {
      const hadOldName = nextValues.includes(oldName);
      nextValues = nextValues.filter((value) => value !== oldName);
      if (hadOldName && !nextValues.includes(newName)) {
        nextValues.push(newName);
      }
      if (hadOldName) {
        nextCategory = newCategory;
      }
    }

    if (nextValues.length === 0) continue;

    const existing = normalized[nextCategory] ?? [];
    normalized[nextCategory] = Array.from(new Set([...existing, ...nextValues]));
  }

  return normalized;
}

async function hasDependencyCollisionOnInstrumentUpdate(
  oldCategory: string,
  oldName: string,
  newCategory: string,
  newName: string,
) {
  if (oldCategory === newCategory && oldName === newName) return false;

  const all = (await prisma.instrumentDependency.findMany({
    select: {
      id: true,
      triggerCategory: true,
      triggerName: true,
      targetCategory: true,
      targetName: true,
    },
  })) as DependencyShape[];

  const map = new Map<string, string>();
  for (const row of all) {
    const nextRow = {
      triggerCategory:
        row.triggerCategory === oldCategory && row.triggerName === oldName ? newCategory : row.triggerCategory,
      triggerName: row.triggerCategory === oldCategory && row.triggerName === oldName ? newName : row.triggerName,
      targetCategory:
        row.targetCategory === oldCategory && row.targetName === oldName ? newCategory : row.targetCategory,
      targetName: row.targetCategory === oldCategory && row.targetName === oldName ? newName : row.targetName,
    };
    const key = dependencyKey(nextRow);
    const existing = map.get(key);
    if (existing && existing !== row.id) {
      return true;
    }
    map.set(key, row.id);
  }

  return false;
}

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
    const { name, category } = body as { name?: string; category?: InstrumentCategory };

    if (name === undefined && category === undefined) {
      return NextResponse.json({ error: "更新項目がありません" }, { status: 400 });
    }

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: "楽器名は必須です" }, { status: 400 });
    }

    const instrument = await prisma.instrument.findUnique({ where: { id } });
    if (!instrument) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const nextName = name?.trim() ?? instrument.name;
    const nextCategory = category ?? instrument.category;

    if (category !== undefined) {
      const categoryExists = await prisma.category.findUnique({ where: { name: category } });
      if (!categoryExists) {
        return NextResponse.json({ error: "カテゴリが不正です" }, { status: 400 });
      }
    }

    const duplicate = await prisma.instrument.findUnique({
      where: { name_category: { name: nextName, category: nextCategory } },
    });
    if (duplicate && duplicate.id !== id) {
      return NextResponse.json({ error: "移動先カテゴリに同名楽器があるため更新できません" }, { status: 409 });
    }

    const hasDependencyConflict = await hasDependencyCollisionOnInstrumentUpdate(
      instrument.category,
      instrument.name,
      nextCategory,
      nextName,
    );
    if (hasDependencyConflict) {
      return NextResponse.json(
        { error: "更新により連動ルールが重複するため実行できません", code: "DEPENDENCY_CONFLICT" },
        { status: 409 },
      );
    }

    const destinationOrder =
      instrument.category === nextCategory
        ? instrument.order
        : await prisma.instrument.count({ where: { category: nextCategory } });

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.instrument.update({
        where: { id },
        data: {
          name: nextName,
          category: nextCategory,
          order: destinationOrder,
        },
      });

      const songs = await tx.song.findMany({ select: { id: true, instruments: true } });
      for (const song of songs) {
        const normalized = normalizeSongInstruments(
          song.instruments,
          instrument.category,
          instrument.name,
          nextCategory,
          nextName,
        );
        await tx.song.update({ where: { id: song.id }, data: { instruments: normalized } });
      }

      await tx.instrumentDependency.updateMany({
        where: {
          triggerCategory: instrument.category,
          triggerName: instrument.name,
        },
        data: { triggerCategory: nextCategory, triggerName: nextName },
      });

      await tx.instrumentDependency.updateMany({
        where: {
          targetCategory: instrument.category,
          targetName: instrument.name,
        },
        data: { targetCategory: nextCategory, targetName: nextName },
      });

      return saved;
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