import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json(categories);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "カテゴリ一覧の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body as { name?: string };
    const nextName = name?.trim();

    if (!nextName) {
      return NextResponse.json({ error: "カテゴリ名は必須です" }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { name: nextName } });
    if (existing) {
      return NextResponse.json({ error: "カテゴリ名が重複しています", code: "CATEGORY_DUPLICATE" }, { status: 409 });
    }

    const order = await prisma.category.count();
    const created = await prisma.category.create({
      data: {
        name: nextName,
        order,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "カテゴリの作成に失敗しました" }, { status: 500 });
  }
}
