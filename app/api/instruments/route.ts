import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InstrumentCategory } from "@/types";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const withId = searchParams.get("withId");
        const instruments = await prisma.instrument.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] });

        if (withId) {
            return NextResponse.json(
                instruments.map((i: { id: string; name: string; category: string }) => ({
                    id: i.id,
                    name: i.name,
                    category: i.category as InstrumentCategory,
                }))
            );
        }

        // Group by category
        const result: Record<string, string[]> = {};
        for (const inst of instruments) {
            if (!result[inst.category]) result[inst.category] = [];
            result[inst.category].push(inst.name);
        }
        return NextResponse.json(result);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch instruments" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, category } = body as { name: string; category: InstrumentCategory };
        if (!name?.trim() || !category) {
            return NextResponse.json({ error: "名前とカテゴリは必須です" }, { status: 400 });
        }
        const categoryExists = await prisma.category.findUnique({ where: { name: category } });
        if (!categoryExists) {
            return NextResponse.json({ error: "カテゴリが不正です" }, { status: 400 });
        }
        // Check duplicate
        const existing = await prisma.instrument.findUnique({
            where: { name_category: { name: name.trim(), category } },
        });
        if (existing) {
            return NextResponse.json({ error: "すでに登録されています" }, { status: 409 });
        }
        const count = await prisma.instrument.count({ where: { category } });
        const instrument = await prisma.instrument.create({
            data: { name: name.trim(), category, order: count },
        });
        return NextResponse.json(instrument, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create instrument" }, { status: 500 });
    }
}