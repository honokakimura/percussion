export type InstrumentCategory = string;

export interface InstrumentCategoryItem {
  id: string;
  name: string;
  order: number;
}

// 初期seed用のデフォルトカテゴリ
export const DEFAULT_INSTRUMENT_CATEGORIES: InstrumentCategory[] = [
  "楽器類",
  "小物(バッグ)",
  "ドラムセット",
  "スタンドケース",
  "その他",
];

export interface Song {
  id: string;
  name: string;
  instruments: Partial<Record<InstrumentCategory, string[]>>;
}

export interface DependencyRule {
  id: string;
  triggerCategory: InstrumentCategory;
  triggerName: string;
  targetCategory: InstrumentCategory;
  targetName: string;
  targetItems: string[];
}

export interface AppState {
  categories: Record<InstrumentCategory, string[]>;
  availableCategories: InstrumentCategoryItem[];
  songs: Song[];
}

export const DEFAULT_DEPENDENCY_RULES: Omit<DependencyRule, "id">[] = [
  {
    triggerCategory: "楽器類",
    triggerName: "グロッケン",
    targetCategory: "その他",
    targetName: "グロッケンスタンド",
    targetItems: ["グロッケンスタンド"],
  },
];

export const DEFAULT_INSTRUMENTS: Record<InstrumentCategory, string[]> = {
  楽器類: ["スネア", "バスドラム", "ティンパニ", "シロフォン", "マリンバ", "グロッケン", "ビブラフォン"],
  "小物(バッグ)": ["スネアバッグ", "シンバルバッグ", "マレットバッグ"],
  ドラムセット: ["バスドラム", "スネア", "ハイハット", "クラッシュシンバル", "ライドシンバル", "タム(小)", "タム(大)", "フロアタム"],
  スタンドケース: ["シロフォンスタンド", "マリンバスタンド", "ビブラフォンスタンド", "ティンパニケース"],
  その他: ["グロッケンスタンド", "椅子", "譜面台"],
};

export const TRANSPORT_FOOTER = `
所有者: 部
運搬経路: 部室 → 会場 → 部室
※後日写真添付`.trim();