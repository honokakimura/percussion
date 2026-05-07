# percussion

打楽器の運搬申請を作成・管理するための Next.js アプリです。曲ごとの必要楽器を登録し、常時運搬セットや連動ルールを加味した申請文を生成できます。

## できること

- 申請文の生成
- 曲の追加、編集、削除
- 楽器の追加、編集、削除
- カテゴリの追加、並び替え、削除
- 楽器同士の連動ルール管理
- 常時運搬セットの管理

## 技術スタック

- Next.js 16
- React 19
- TypeScript
- Prisma
- PostgreSQL
- Zustand
- Tailwind CSS 4

## 必要環境

- Node.js 20 以上を推奨
- PostgreSQL が利用できること
- `DATABASE_URL` が設定されていること

## セットアップ

1. 依存関係をインストールします。

```bash
npm install
```

2. 環境変数を設定します。`.env` などに PostgreSQL の接続文字列を入れてください。

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME"
```

3. Prisma クライアントを生成し、必要なら DB を反映します。

```bash
npm run db:generate
npm run db:push
```

4. 初期データを入れる場合は seed を実行します。

```bash
npm run db:seed
```

5. 開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くとアプリを確認できます。

## スクリプト

- `npm run dev`: 開発サーバーを起動
- `npm run build`: 本番ビルド
- `npm run start`: ビルド済みアプリを起動
- `npm run lint`: ESLint を実行
- `npm run db:push`: Prisma スキーマを DB に反映
- `npm run db:generate`: Prisma Client を生成
- `npm run db:studio`: Prisma Studio を起動
- `npm run db:reset`: DB をリセット
- `npm run db:seed`: seed を実行

## 使い方

アプリのトップ画面は 3 つのタブで構成されています。

- 申請作成: 曲を選び、必要な楽器を調整して申請文をコピー
- 曲の管理: 曲ごとの必要楽器を登録・編集
- 楽器の管理: カテゴリ、楽器、連動ルール、常時運搬セットを管理

## 補足

- データ取得と更新は `/api` 配下のエンドポイントを使います。
- 申請文の末尾は `types/index.ts` の `TRANSPORT_FOOTER` で管理しています。
- このリポジトリは AI（Github Copilot） によるバイブコーディングを取り入れて作成しています。
