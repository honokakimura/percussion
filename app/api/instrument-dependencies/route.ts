import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DependencyRule, InstrumentCategory, INSTRUMENT_CATEGORIES } from "@/types";

function isValidCategory(value: string): value is InstrumentCategory {
    return INSTRUMENT_CATEGORIES.includes(value as InstrumentCategory);
}

export async function GET() {
    try {
        const rules = await prisma.instrumentDependency.findMany({
            orderBy: [
                { triggerCategory: "asc" },
                { triggerName: "asc" },
                { targetCategory: "asc" },
                { targetName: "asc" },
            ],
        });

        return NextResponse.json(rules as DependencyRule[]);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch dependency rules" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { triggerCategory, triggerName, targetCategory, targetName, targetItems } = body as {
            triggerCategory: string;
            triggerName: string;
            targetCategory: string;
            targetName: string;
            targetItems?: string[]; 
        };

        if (!isValidCategory(triggerCategory) || !isValidCategory(targetCategory)) {
            return NextResponse.json({ error: "カテゴリが不正です" }, { status: 400 });
        }

        if (!triggerName?.trim() || !targetName?.trim()) {
            return NextResponse.json({ error: "楽器名は必須です" }, { status: 400 });
        }

        if (triggerCategory === targetCategory && triggerName.trim() === targetName.trim()) {
            return NextResponse.json({ error: "同じ楽器同士は登録できません" }, { status: 400 });
        }

        const trigger = await prisma.instrument.findUnique({
            where: { name_category: { name: triggerName.trim(), category: triggerCategory } },
        });
        const target = await prisma.instrument.findUnique({
            where: { name_category: { name: targetName.trim(), category: targetCategory } },
        });

        if (!trigger || !target) {
            return NextResponse.json({ error: "対象の楽器が見つかりません" }, { status: 404 });
        }

        const rule = await prisma.instrumentDependency.create({
            data: {
                triggerCategory,
                triggerName: triggerName.trim(),
                targetCategory,
                targetName: targetName.trim(),
                targetItems: targetItems || [targetName.trim()], 
            },
        });

        return NextResponse.json(rule, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create dependency rule" }, { status: 500 });
    }
}