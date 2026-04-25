import { PrismaClient } from "@prisma/client";
import { DEFAULT_DEPENDENCY_RULES, DEFAULT_INSTRUMENTS } from "../types";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

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
            create: rule,
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
