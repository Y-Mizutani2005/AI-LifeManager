# 📚 Swagger UI を使った API テストガイド

このガイドでは、FastAPIが自動生成する **Swagger UI** を使って、バックエンドAPIをテストする方法を説明します。

---

## 🎯 目次

1. [Swagger UIとは？](#swagger-uiとは)
2. [準備：サーバーの起動](#準備サーバーの起動)
3. [Swagger UIを開く](#swagger-uiを開く)
4. [テスト実施手順](#テスト実施手順)
   - [Health Check](#1-health-check)
   - [Projects API](#2-projects-api)
   - [Milestones API](#3-milestones-api)
   - [Tasks API](#4-tasks-api)
5. [トラブルシューティング](#トラブルシューティング)

---

## Swagger UIとは？

**Swagger UI**は、FastAPIが自動で生成してくれる**インタラクティブなAPIドキュメント**です。

### 主な特徴

- ✅ **完全無料** - 追加インストール不要
- ✅ **自動生成** - コードから自動的に作成される
- ✅ **ブラウザで動作** - 使いやすいUI
- ✅ **実際にリクエスト送信可能** - その場でAPIをテストできる
- ✅ **レスポンス確認** - 結果がすぐに表示される

---

## 準備：サーバーの起動

### 方法1: start-dev.bat を使う（推奨）

プロジェクトのルートディレクトリで以下を実行：

```bash
start-dev.bat
```

### 方法2: 手動で起動

```powershell
# 仮想環境をアクティベート
venv\Scripts\activate.bat

# バックエンドディレクトリに移動
cd backend

# サーバー起動
uvicorn app.main:app --reload
```

### 起動確認

以下のメッセージが表示されれば成功です：

```
🚀 AI Project Companion v0.1.0 を起動中...
✅ Semantic Kernel を初期化しました
✅ OpenAI モデル: gpt-4
🎉 アプリケーションの起動が完了しました!

INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

## Swagger UIを開く

ブラウザで以下のURLを開いてください：

### 🌐 Swagger UI URL
```
http://localhost:8000/docs
```

> 💡 **別の選択肢**: ReDoc形式のドキュメントは `http://localhost:8000/redoc` で見られます。

---

## テスト実施手順

### 基本的な操作方法

Swagger UIでのテストは以下の流れで行います：

1. **エンドポイントをクリック** - 展開されます
2. **「Try it out」ボタンをクリック** - 編集可能になります
3. **パラメータを入力** - 必要に応じて値を入力・編集
4. **「Execute」ボタンをクリック** - リクエストが送信されます
5. **レスポンスを確認** - 下部にレスポンスが表示されます

---

## 1. Health Check

まず、サーバーが正常に動作しているか確認しましょう。

### 手順

1. **「health」セクション**を探す
2. `GET /health` をクリック
3. 「**Try it out**」ボタンをクリック
4. 「**Execute**」ボタンをクリック

### 期待されるレスポンス

**Status Code**: `200`

```json
{
  "status": "ok",
  "openai_configured": true,
  "db_status": "ok",
  "app_name": "AI Project Companion",
  "version": "0.1.0"
}
```

✅ `status: "ok"` であれば成功です！

---

## 2. Projects API

プロジェクトのCRUD操作をテストします。

### 2-1. 全プロジェクトを取得（GET）

**エンドポイント**: `GET /api/projects`

#### 手順
1. **「projects」セクション**を探す
2. `GET /api/projects` をクリック
3. 「**Try it out**」ボタンをクリック
4. `user_id` パラメータ: `default_user`（デフォルト値のまま）
5. 「**Execute**」ボタンをクリック

#### 期待されるレスポンス
**Status Code**: `200`

```json
[]  // 最初は空の配列
```

---

### 2-2. プロジェクトを作成（POST）

**エンドポイント**: `POST /api/projects`

#### 手順
1. `POST /api/projects` をクリック
2. 「**Try it out**」ボタンをクリック
3. **Request body** を以下のように編集：

```json
{
  "userId": "default_user",
  "title": "テストプロジェクト",
  "description": "Swagger UIからのテスト",
  "goal": "APIの動作確認を成功させる",
  "status": "active",
  "startDate": "2025-10-10T00:00:00.000Z",
  "targetEndDate": "2025-12-31T23:59:59.000Z",
  "tags": ["test", "api"],
  "color": "#3B82F6",
  "context": {
    "motivation": "APIの動作確認",
    "weeklyHours": 10,
    "constraints": ["時間制約あり"],
    "resources": ["ドキュメント", "テストツール"]
  }
}
```

4. 「**Execute**」ボタンをクリック

#### 期待されるレスポンス
**Status Code**: `200`

```json
{
  "id": "abc123-456def-789ghi...",  // 自動生成されたID
  "userId": "default_user",
  "title": "テストプロジェクト",
  "description": "Swagger UIからのテスト",
  "goal": "APIの動作確認を成功させる",
  "status": "active",
  "startDate": "2025-10-10T00:00:00.000Z",
  "targetEndDate": "2025-12-31T23:59:59.000Z",
  // ... その他のフィールド
}
```

✅ **重要**: レスポンスの `id` をコピーしてメモ帳などに保存してください！次のテストで使います。

---

### 2-3. 特定のプロジェクトを取得（GET）

**エンドポイント**: `GET /api/projects/{project_id}`

#### 手順
1. `GET /api/projects/{project_id}` をクリック
2. 「**Try it out**」ボタンをクリック
3. `project_id` に、先ほどコピーした **プロジェクトID** を貼り付け
4. 「**Execute**」ボタンをクリック

#### 期待されるレスポンス
**Status Code**: `200`

作成したプロジェクトの詳細が返ってきます。

---

### 2-4. プロジェクトを更新（PUT）

**エンドポイント**: `PUT /api/projects/{project_id}`

#### 手順
1. `PUT /api/projects/{project_id}` をクリック
2. 「**Try it out**」ボタンをクリック
3. `project_id` に、**プロジェクトID** を貼り付け
4. **Request body** を以下のように編集：

```json
{
  "title": "更新されたプロジェクト",
  "description": "Swagger UIから更新しました",
  "status": "active"
}
```

5. 「**Execute**」ボタンをクリック

#### 期待されるレスポンス
**Status Code**: `200`

更新されたプロジェクトの情報が返ってきます。

---

### 2-5. プロジェクトを削除（DELETE）

**エンドポイント**: `DELETE /api/projects/{project_id}`

> ⚠️ **注意**: 削除すると、関連するマイルストーンとタスクも削除されます（カスケード削除）

#### 手順
1. `DELETE /api/projects/{project_id}` をクリック
2. 「**Try it out**」ボタンをクリック
3. `project_id` に、**プロジェクトID** を貼り付け
4. 「**Execute**」ボタンをクリック

#### 期待されるレスポンス
**Status Code**: `200`

```json
{
  "message": "Project deleted successfully"
}
```

---

## 3. Milestones API

マイルストーンのCRUD操作をテストします。

> 💡 **前提**: プロジェクトが作成されている必要があります。まだの場合は、先に[2-2. プロジェクトを作成](#2-2-プロジェクトを作成post)を実施してください。

### 3-1. 全マイルストーンを取得（GET）

**エンドポイント**: `GET /api/milestones`

#### 手順
1. `GET /api/milestones` をクリック
2. 「**Try it out**」ボタンをクリック
3. `project_id` に、**プロジェクトID** を貼り付け（オプション）
4. 「**Execute**」ボタンをクリック

---

### 3-2. マイルストーンを作成（POST）

**エンドポイント**: `POST /api/milestones`

#### 手順
1. `POST /api/milestones` をクリック
2. 「**Try it out**」ボタンをクリック
3. **Request body** を以下のように編集：

```json
{
  "projectId": "ここにプロジェクトIDを貼り付け",
  "title": "フェーズ1: 要件定義",
  "description": "プロジェクトの要件を定義する",
  "order": 1,
  "dueDate": "2025-11-30T23:59:59.000Z",
  "status": "not_started"
}
```

4. 「**Execute**」ボタンをクリック

#### 期待されるレスポンス
**Status Code**: `200`

✅ レスポンスの `id` をコピーして保存してください（マイルストーンID）

---

### 3-3. 特定のマイルストーンを取得（GET）

**エンドポイント**: `GET /api/milestones/{milestone_id}`

#### 手順
1. `GET /api/milestones/{milestone_id}` をクリック
2. 「**Try it out**」ボタンをクリック
3. `milestone_id` に、**マイルストーンID** を貼り付け
4. 「**Execute**」ボタンをクリック

---

### 3-4. マイルストーンを更新（PUT）

**エンドポイント**: `PUT /api/milestones/{milestone_id}`

#### 手順
1. `PUT /api/milestones/{milestone_id}` をクリック
2. 「**Try it out**」ボタンをクリック
3. `milestone_id` に、**マイルストーンID** を貼り付け
4. **Request body**:

```json
{
  "title": "フェーズ1: 要件定義（更新）",
  "status": "in_progress"
}
```

5. 「**Execute**」ボタンをクリック

---

### 3-5. マイルストーンを削除（DELETE）

**エンドポイント**: `DELETE /api/milestones/{milestone_id}`

#### 手順
1. `DELETE /api/milestones/{milestone_id}` をクリック
2. 「**Try it out**」ボタンをクリック
3. `milestone_id` に、**マイルストーンID** を貼り付け
4. 「**Execute**」ボタンをクリック

---

## 4. Tasks API

タスクのCRUD操作をテストします。

> 💡 **前提**: プロジェクトとマイルストーンが作成されている必要があります。

### 4-1. 全タスクを取得（GET）

**エンドポイント**: `GET /api/tasks`

#### 手順
1. `GET /api/tasks` をクリック
2. 「**Try it out**」ボタンをクリック
3. `project_id` に、**プロジェクトID** を貼り付け（オプション）
4. 「**Execute**」ボタンをクリック

---

### 4-2. タスクを作成（POST）

**エンドポイント**: `POST /api/tasks`

#### 手順
1. `POST /api/tasks` をクリック
2. 「**Try it out**」ボタンをクリック
3. **Request body** を以下のように編集：

```json
{
  "projectId": "ここにプロジェクトIDを貼り付け",
  "milestoneId": "ここにマイルストーンIDを貼り付け",
  "title": "テストタスク",
  "description": "Swagger UIからのテスト",
  "status": "todo",
  "priority": "high",
  "dueDate": "2025-10-15T23:59:59.000Z",
  "startDate": "2025-10-10T00:00:00.000Z",
  "estimatedHours": 5,
  "actualHours": 0,
  "dependencies": [],
  "blockedBy": [],
  "tags": ["test"],
  "isToday": true
}
```

4. 「**Execute**」ボタンをクリック

#### 期待されるレスポンス
**Status Code**: `200`

✅ レスポンスの `id` をコピーして保存してください（タスクID）

---

### 4-3. 特定のタスクを取得（GET）

**エンドポイント**: `GET /api/tasks/{task_id}`

#### 手順
1. `GET /api/tasks/{task_id}` をクリック
2. 「**Try it out**」ボタンをクリック
3. `task_id` に、**タスクID** を貼り付け
4. 「**Execute**」ボタンをクリック

---

### 4-4. タスクを更新（PUT）

**エンドポイント**: `PUT /api/tasks/{task_id}`

#### 手順
1. `PUT /api/tasks/{task_id}` をクリック
2. 「**Try it out**」ボタンをクリック
3. `task_id` に、**タスクID** を貼り付け
4. **Request body**:

```json
{
  "title": "完了したタスク",
  "status": "done",
  "priority": "medium"
}
```

5. 「**Execute**」ボタンをクリック

---

### 4-5. タスクを削除（DELETE）

**エンドポイント**: `DELETE /api/tasks/{task_id}`

#### 手順
1. `DELETE /api/tasks/{task_id}` をクリック
2. 「**Try it out**」ボタンをクリック
3. `task_id` に、**タスクID** を貼り付け
4. 「**Execute**」ボタンをクリック

---

## トラブルシューティング

### サーバーに接続できない

**症状**: Swagger UIが開かない、またはエラーが表示される

**解決策**:
1. バックエンドサーバーが起動しているか確認
   ```powershell
   curl http://localhost:8000/health
   ```
2. ポート番号が正しいか確認（デフォルトは 8000）
3. ファイアウォール設定を確認

---

### 404 Not Found エラー

**症状**: `{"detail":"Not Found"}`

**解決策**:
1. エンドポイントのパスが正しいか確認
2. HTTPメソッド（GET/POST/PUT/DELETE）が正しいか確認
3. IDが正しく入力されているか確認

---

### 422 Validation Error

**症状**: `{"detail":[{"type":"missing","msg":"Field required",...}]}`

**解決策**:
1. 必須フィールドがすべて入力されているか確認
2. データ型が正しいか確認（文字列、数値、配列など）
3. JSONの形式が正しいか確認（カンマの位置、括弧の対応など）

---

### データベースエラー

**症状**: `db_status: "error: ..."`

**解決策**:
1. PostgreSQL が起動しているか確認
2. `.env` ファイルのデータベース接続情報を確認
3. データベースが初期化されているか確認

---

## 💡 便利なTips

### 1. レスポンスのコピー

レスポンスの右上にある「Copy」ボタンで、JSONをクリップボードにコピーできます。

### 2. サンプルデータの活用

各エンドポイントには「Example Value」が表示されています。これをクリックすると、Request bodyに自動で入力されます。

### 3. スキーマの確認

「Schemas」セクション（ページ下部）で、各データモデルの詳細を確認できます。

### 4. 複数のタブで開く

ブラウザのタブを複数開いて、異なるエンドポイントを同時に確認することもできます。

---

## 📋 テストチェックリスト

完了したらチェックを入れましょう！

### Health Check
- [ ] GET /health - サーバー状態確認

### Projects API
- [ ] GET /api/projects - 全プロジェクト取得
- [ ] POST /api/projects - プロジェクト作成
- [ ] GET /api/projects/{project_id} - 特定プロジェクト取得
- [ ] PUT /api/projects/{project_id} - プロジェクト更新
- [ ] DELETE /api/projects/{project_id} - プロジェクト削除

### Milestones API
- [ ] GET /api/milestones - 全マイルストーン取得
- [ ] POST /api/milestones - マイルストーン作成
- [ ] GET /api/milestones/{milestone_id} - 特定マイルストーン取得
- [ ] PUT /api/milestones/{milestone_id} - マイルストーン更新
- [ ] DELETE /api/milestones/{milestone_id} - マイルストーン削除

### Tasks API
- [ ] GET /api/tasks - 全タスク取得
- [ ] POST /api/tasks - タスク作成
- [ ] GET /api/tasks/{task_id} - 特定タスク取得
- [ ] PUT /api/tasks/{task_id} - タスク更新
- [ ] DELETE /api/tasks/{task_id} - タスク削除

---

## 🎉 まとめ

Swagger UIを使えば、コードを書かずにブラウザだけで簡単にAPIテストができます！

- ✅ 無料で使える
- ✅ インストール不要
- ✅ 直感的な操作
- ✅ すぐに結果が確認できる

これでバックエンドAPIの動作確認は完璧です！🚀

---

**作成日**: 2025-10-10  
**バージョン**: 1.0  
**対象**: AI Project Companion Backend API
