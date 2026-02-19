# Observation Log

個人向けの観察ログアプリです。観察（事実）・解釈・次アクションを構造化して保存し、検索・再利用しやすくします。

## 主な機能（MVP）
- メール認証コードログイン（SMTP）
- 観察ログの作成/一覧/詳細/編集/削除
- Draft / Active / Archived の状態管理
- 検索、フィルタ、ソート、ページング
- 添付（image/pdf/csv）と外部リンク
- 1件Markdownエクスポート
- デスクトップ優先UI

## 技術スタック
- Next.js 15 (App Router)
- React 19
- TypeScript
- Nodemailer (SMTP送信)
- JSONファイル永続化（`db/data.json`）

## セットアップ
```bash
npm install
```

### 必須環境変数（SMTP）
`.env.local` に設定します。

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASS=your-password
SMTP_FROM=Observation Log <no-reply@example.com>
```

### 任意環境変数
```env
# テスト/ローカルでDB・添付保存先を分離したい場合
OBS_DB_FILE=/absolute/path/to/data.json
OBS_STORAGE_DIR=/absolute/path/to/storage
```

## 開発
```bash
npm run dev
```

## テスト
```bash
npm test
```

内訳:
- `test:smoke`: ファイル存在チェック
- `test:unit`: ドメインロジック + APIルートのテスト

## ビルド
```bash
npm run build
npm run start
```

## 主要ディレクトリ
- `app/`: 画面とAPIルート
- `components/`: 共通UI（ヘッダー、認証フォーム、トースト）
- `lib/`: ドメインロジック、ストア、メール送信
- `db/`: スキーマとローカルデータ
- `tests/`, `tests-ts/`: テスト

## 補足
- メール送信が未設定の開発環境では、認証コードはサーバーログに出力されます。
- 本番環境ではSMTP未設定だと認証コード送信は失敗します。
