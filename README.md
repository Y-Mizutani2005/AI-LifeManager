# Project Companion MVP

AI対話でタスク管理ができる個人向けWebアプリ

## セットアップ

---
---

## Dockerなしでのローカル開発手順

### バックエンド（Python/FastAPI）

1. `cd backend`
2. 仮想環境作成  
   `python -m venv venv`
3. 仮想環境有効化  
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. 依存インストール  
   `pip install -r requirements.txt`
5. `.env`ファイルを編集し、DB_HOSTを`localhost`などローカルDBに合わせて修正
6. PostgreSQLをローカルで起動し、.envのDB情報と一致させる
7. サーバ起動  
   `uvicorn main:app --reload`

### フロントエンド（React/Vite）

1. `cd frontend`
2. 依存インストール  
   `npm install`
3. 開発サーバ起動  
   `npm run dev`

### .envファイル管理

- `.env.example`を参考に各自`.env`を作成
- `.env`は`.gitignore`で管理

### Windows環境の注意

- venv有効化は `venv\Scripts\activate`
- Node.jsは公式インストーラーまたは`nvm-windows`推奨
- パス区切り・改行コードの違いに注意
- 権限・ファイアウォール設定でAPI/DB接続がブロックされる場合あり

---


#### 1. 必要なファイルの準備

- `backend/.env` を以下の内容で作成してください（サンプル）:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres
```

#### 2. サービスのビルド・起動

```bash
docker-compose up --build
```

#### 3. 各サービスへのアクセス

- フロントエンド（Vite）: [http://localhost:5173](http://localhost:5173)
- バックエンド（FastAPI）: [http://localhost:8000](http://localhost:8000)
- PostgreSQL: ホストからは直接アクセス不可（サービス間連携のみ）

#### 4. DB永続化・サービス連携のポイント

- PostgreSQLはdocker-composeの`volumes`設定によりデータが永続化されます。
- backendサービスは`.env`のDB接続情報を利用し、`db`サービス（PostgreSQL）と連携します。
- frontendとbackendは同一ネットワーク上で連携されます。

---

### 1. OpenAI APIキーの取得
- https://platform.openai.com/api-keys でAPIキーを取得
- `backend/.env` ファイルに `OPENAI_API_KEY=sk-...` を設定

### 使い方
1. 右側のチャットで「明日までにログイン機能を作る」と入力
2. AIがタスクを自動生成
3. 左側のタスクリストでチェックボックスをクリックして完了

## 技術スタック
- Frontend: React + TypeScript + Tailwind CSS + Zustand
- Backend: FastAPI + Semantic Kernel + OpenAI GPT-4o-mini
