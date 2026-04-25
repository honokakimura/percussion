export type InstrumentCategory =
  | "楽器類"
  | "小物(バッグ)"
  | "ドラムセット"
  | "スタンドケース"
  | "その他";

export const INSTRUMENT_CATEGORIES: InstrumentCategory[] = [
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

export interface AppState {
  categories: Record<InstrumentCategory, string[]>;
  songs: Song[];
}

export interface DependencyRule {
  triggerItem: string;
  targetCategory: InstrumentCategory;
  targetItems: string[];
}

export const DEPENDENCY_RULES: DependencyRule[] = [
  {
    triggerItem: "グロッケン",
    targetCategory: "その他",
    targetItems: ["グロッケンスタンド"],
  },
  {
    triggerItem: "シロフォン",
    targetCategory: "スタンドケース",
    targetItems: ["シロフォンスタンド"],
  },
  {
    triggerItem: "マリンバ",
    targetCategory: "スタンドケース",
    targetItems: ["マリンバスタンド"],
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
【所有者】吹奏楽部
【運搬経路】部室 → 搬入口 → エレベーター → 会場
【備考】取り扱いに注意してください。`.trim();