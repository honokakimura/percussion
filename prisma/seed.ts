// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
// ここは環境に合わせてパスを調整してください（npx ts-nodeで実行する場合、aliasが効かないことがあります）
// import { DEFAULT_INSTRUMENTS } from "../src/types"; 

const prisma = new PrismaClient();

// もしインポートでエラーが出る場合は、ここに直接定義を置くと確実です
const DEFAULT_INSTRUMENTS: Record<string, string[]> = {
  "楽器類": ["スネア", "バスドラム", "ティンパニ", "シロフォン", "マリンバ", "グロッケン", "ビブラフォン"],
  "小物(バッグ)": ["スネアバッグ", "シンバルバッグ", "マレットバッグ"],
  "ドラムセット": ["バスドラム", "スネア", "ハイハット", "クラッシュシンバル", "ライドシンバル", "タム(小)", "タム(大)", "フロアタム"],
  "スタンドケース": ["シロフォンスタンド", "マリンバスタンド", "ビブラフォンスタンド", "ティンパニケース"],
  "その他": ["グロッケンスタンド", "椅子", "譜面台"],
};

async function main() {
  console.log("Seeding database...");

  for (const [category, instruments] of Object.entries(DEFAULT_INSTRUMENTS)) {
    for (let i = 0; i < instruments.length; i++) {
      // モデル名「instrument」がスキーマにあるので、これでエラーが出なくなります
      await prisma.instrument.upsert({
        where: { 
          name_category: { // schema.prismaの @@unique([name, category]) に対応
            name: instruments[i], 
            category 
          } 
        },
        update: {},
        create: { 
          name: instruments[i], 
          category, 
          order: i 
        },
      });
    }
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