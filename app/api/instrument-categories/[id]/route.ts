import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  previousCategoryName: string,
  nextCategoryName?: string,
): Record<string, string[]> {
  const record = (instruments ?? {}) as Record<string, string[]>;
  const normalized: Record<string, string[]> = {};

  for (const [category, values] of Object.entries(record)) {
    if (!Array.isArray(values)) continue;
    const cleaned = values.filter((value) => typeof value === "string" && value.trim().length > 0);
    if (cleaned.length === 0) continue;

    const key = category === previousCategoryName && nextCategoryName ? nextCategoryName : category;
    const bucket = normalized[key] ?? [];
    const merged = new Set([...bucket, ...cleaned]);
    normalized[key] = Array.from(merged);
  }

  if (!nextCategoryName) {
    delete normalized[previousCategoryName];
  }

  return normalized;
}

async function hasDependencyCollisionOnCategoryRename(oldCategoryName: string, newCategoryName: string) {
  if (oldCategoryName === newCategoryName) return false;

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
      triggerCategory: row.triggerCategory === oldCategoryName ? newCategoryName : row.triggerCategory,
      triggerName: row.triggerName,
      targetCategory: row.targetCategory === oldCategoryName ? newCategoryName : row.targetCategory,
      targetName: row.targetName,
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

async function reindexCategoryOrder(targetId: string, targetOrder: number) {
  const categories = await prisma.category.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  const moving = categories.find((item) => item.id === targetId);
  if (!moving) return null;

  const others = categories.filter((item) => item.id !== targetId);
  const nextIndex = Math.max(0, Math.min(targetOrder, others.length));
  others.splice(nextIndex, 0, moving);

  await Promise.all(
    others.map((item, index) =>
      prisma.category.update({
        where: { id: item.id },
        data: { order: index },
      }),
    ),
  );

  return prisma.category.findUnique({ where: { id: targetId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, order } = body as { name?: string; order?: number };

    if (name === undefined && order === undefined) {
      return NextResponse.json({ error: "更新項目がありません" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: "カテゴリが見つかりません" }, { status: 404 });
    }

    const nextName = name?.trim();
    if (name !== undefined && !nextName) {
      return NextResponse.json({ error: "カテゴリ名は必須です" }, { status: 400 });
    }

    if (nextName && nextName !== category.name) {
      const duplicated = await prisma.category.findUnique({ where: { name: nextName } });
      if (duplicated) {
        return NextResponse.json({ error: "カテゴリ名が重複しています", code: "CATEGORY_DUPLICATE" }, { status: 409 });
      }

      const nameConflictedInstrument = await prisma.instrument.findFirst({
        where: {
          category: category.name,
          name: {
            in: (
              await prisma.instrument.findMany({
                where: { category: nextName },
                select: { name: true },
              })
            ).map((item) => item.name),
          },
        },
      });
      if (nameConflictedInstrument) {
        return NextResponse.json(
          { error: "カテゴリ変更先に同名楽器があり移動できません", code: "INSTRUMENT_DUPLICATE_ON_CATEGORY_RENAME" },
          { status: 409 },
        );
      }

      const hasDependencyConflict = await hasDependencyCollisionOnCategoryRename(category.name, nextName);
      if (hasDependencyConflict) {
        return NextResponse.json(
          { error: "カテゴリ変更により連動ルールが衝突するため更新できません", code: "DEPENDENCY_CONFLICT" },
          { status: 409 },
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.instrument.updateMany({
          where: { category: category.name },
          data: { category: nextName },
        });

        const songs = await tx.song.findMany({ select: { id: true, instruments: true } });
        for (const song of songs) {
          const normalized = normalizeSongInstruments(song.instruments, category.name, nextName);
          await tx.song.update({
            where: { id: song.id },
            data: { instruments: normalized },
          });
        }

        await tx.instrumentDependency.updateMany({
          where: { triggerCategory: category.name },
          data: { triggerCategory: nextName },
        });

        await tx.instrumentDependency.updateMany({
          where: { targetCategory: category.name },
          data: { targetCategory: nextName },
        });

        await tx.category.update({
          where: { id },
          data: { name: nextName },
        });
      });
    }

    if (typeof order === "number" && Number.isFinite(order)) {
      const updated = await reindexCategoryOrder(id, Math.floor(order));
      if (!updated) {
        return NextResponse.json({ error: "カテゴリが見つかりません" }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    const updated = await prisma.category.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "カテゴリの更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: "カテゴリが見つかりません" }, { status: 404 });
    }

    const count = await prisma.instrument.count({ where: { category: category.name } });
    if (count > 0) {
      return NextResponse.json(
        { error: "このカテゴリには楽器が残っているため削除できません", code: "CATEGORY_HAS_INSTRUMENTS" },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.category.delete({ where: { id } });

      const songs = await tx.song.findMany({ select: { id: true, instruments: true } });
      for (const song of songs) {
        const normalized = normalizeSongInstruments(song.instruments, category.name);
        await tx.song.update({
          where: { id: song.id },
          data: { instruments: normalized },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "カテゴリの削除に失敗しました" }, { status: 500 });
  }
}
