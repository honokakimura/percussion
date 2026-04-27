import { PrismaClient } from "@prisma/client";
import {
    DEFAULT_DEPENDENCY_RULES,
    DEFAULT_INSTRUMENTS,
    DEFAULT_INSTRUMENT_CATEGORIES,
} from "../types";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    for (let i = 0; i < DEFAULT_INSTRUMENT_CATEGORIES.length; i++) {
        const category = DEFAULT_INSTRUMENT_CATEGORIES[i];
        await prisma.category.upsert({
            where: { name: category },
            update: { order: i },
            create: {
                name: category,
                order: i,
            },
        });
    }

    for (const [category, instruments] of Object.entries(DEFAULT_INSTRUMENTS)) {
        for (let i = 0; i < instruments.length; i++) {
            await prisma.instrument.upsert({
                where: {
                    name_category: {
                        name: instruments[i],
                        category,
                    },
                },
                update: {},
                create: {
                    name: instruments[i],
                    category,
                    order: i,
                },
            });
        }
    }

    const existingInstrumentCategories = await prisma.instrument.findMany({
        select: { category: true },
        distinct: ["category"],
    });
    const existingCategoryCount = await prisma.category.count();
    let nextOrder = existingCategoryCount;

    for (const row of existingInstrumentCategories) {
        const categoryName = row.category.trim();
        if (!categoryName) continue;

        const exists = await prisma.category.findUnique({ where: { name: categoryName } });
        if (exists) continue;

        await prisma.category.create({
            data: {
                name: categoryName,
                order: nextOrder,
            },
        });
        nextOrder += 1;
    }

    for (const rule of DEFAULT_DEPENDENCY_RULES) {
        await prisma.instrumentDependency.upsert({
            where: {
                triggerCategory_triggerName_targetCategory_targetName: {
                    triggerCategory: rule.triggerCategory,
                    triggerName: rule.triggerName,
                    targetCategory: rule.targetCategory,
                    targetName: rule.targetName,
                },
            },
            update: {
                targetCategory: rule.targetCategory,
                targetItems: rule.targetItems,
            },
            create: {
                triggerCategory: rule.triggerCategory,
                triggerName: rule.triggerName,
                targetCategory: rule.targetCategory,
                targetName: rule.targetName,
                targetItems: rule.targetItems,
            },
        });
    }

    console.log("Seed complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });