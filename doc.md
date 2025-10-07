```
# Project Companion MVP - 環境構築プロンプト

以下の指示に従って、AIタスク管理アプリのMVP環境を構築してください。

## プロジェクト概要
- **アプリ名**: Project Companion
- **目的**: AI対話でタスク管理ができる個人向けWebアプリのMVP
- **技術構成**: React (TypeScript) + FastAPI + Semantic Kernel

---

## 📁 プロジェクト構造を作成

以下のディレクトリ構造を作成してください：

```

project-companion-mvp/
├── frontend/
├── backend/
├── .gitignore
└── README.md

```

---

## 🎨 フロントエンド環境構築

### 1. frontend/ ディレクトリで以下を実行

```bash
# Vite + React + TypeScript プロジェクト作成
npm create vite@latest . -- --template react-ts

# 依存パッケージインストール
npm install zustand

# Tailwind CSS セットアップ
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. tailwind.config.js を作成

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 3. src/index.css を以下に置き換え

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. src/App.tsx を以下のコードに置き換え

```tsx
import { useState } from 'react'
import { create } from 'zustand'

// Store
interface Task {
  id: string
  title: string
  status: 'todo' | 'done'
  priority: 'high' | 'medium' | 'low'
}

const useStore = create<{
  tasks: Task[]
  addTask: (task: Omit<Task, 'id'>) => void
  toggleTask: (id: string) => void
}>((set) => ({
  tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
  addTask: (task) => set((state) => {
    const newTask = { ...task, id: crypto.randomUUID() }
    const newTasks = [...state.tasks, newTask]
    localStorage.setItem('tasks', JSON.stringify(newTasks))
    return { tasks: newTasks }
  }),
  toggleTask: (id) => set((state) => {
    const newTasks = state.tasks.map(t => 
      t.id === id ? { ...t, status: t.status === 'todo' ? 'done' : 'todo' } : t
    )
    localStorage.setItem('tasks', JSON.stringify(newTasks))
    return { tasks: newTasks }
  })
}))

// Main App
export default function App() {
  const { tasks, addTask, toggleTask } = useStore()
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([])
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!message.trim()) return
  
    setChatHistory(prev => [...prev, { role: 'user', content: message }])
    setLoading(true)
  
    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, tasks })
      })
      const data = await res.json()
    
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }])
      setMessage('')
    
      // タスク作成の判定
      if (data.response.includes('"action": "create_task"')) {
        try {
          const taskData = JSON.parse(data.response.match(/\{.*\}/s)?.[0] || '{}')
          if (taskData.task) {
            addTask({ ...taskData.task, status: 'todo' })
          }
        } catch (e) {
          console.error('Task parsing error:', e)
        }
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'エラーが発生しました。バックエンドが起動しているか確認してください。' 
      }])
    } finally {
      setLoading(false)
    }
  }

  const todayTasks = tasks.filter(t => t.status === 'todo')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Project Companion 🚀</h1>
      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Tasks */}
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Today's Tasks ({todayTasks.length})
            </h2>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-400">
                  タスクがありません。<br />右のチャットでAIに相談してみましょう！
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="bg-white p-4 rounded-lg shadow flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={task.status === 'done'}
                      onChange={() => toggleTask(task.id)}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className={task.status === 'done' ? 'line-through text-gray-400' : ''}>
                      {task.title}
                    </span>
                    <span className={`ml-auto text-xs px-2 py-1 rounded ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' : 
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Chat */}
          <div className="flex flex-col h-[600px]">
            <h2 className="text-2xl font-bold mb-4">AI Assistant 💬</h2>
            <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-y-auto mb-4">
              {chatHistory.length === 0 ? (
                <div className="text-gray-400 text-center mt-20">
                  <p className="mb-4">AIアシスタントに話しかけてみましょう！</p>
                  <p className="text-sm">例: 「明日までにログイン機能を作る」</p>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-lg max-w-[80%] ${
                      msg.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                placeholder="例: 明日までにログイン機能を作る"
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button 
                onClick={sendMessage} 
                disabled={loading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? '送信中...' : '送信'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 5. src/App.css と src/index.css の不要な初期スタイルを削除

---

## 🐍 バックエンド環境構築

### 1. backend/ ディレクトリで以下のファイルを作成

#### requirements.txt

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
semantic-kernel==1.0.0
python-dotenv==1.0.0
```

#### .env

```env
OPENAI_API_KEY=your_openai_api_key_here
```

#### main.py

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion
from semantic_kernel.contents import ChatHistory
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Project Companion API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Viteのデフォルトポート
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Semantic Kernel初期化
kernel = Kernel()

# OpenAI接続設定
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY が .env ファイルに設定されていません")

service_id = "chat"
kernel.add_service(
    OpenAIChatCompletion(
        service_id=service_id,
        ai_model_id="gpt-4o-mini",  # コスト効率重視
        api_key=api_key
    )
)

# リクエスト/レスポンスモデル
class Task(BaseModel):
    id: str
    title: str
    status: str
    priority: str

class ChatRequest(BaseModel):
    message: str
    tasks: list[Task] = []

class ChatResponse(BaseModel):
    response: str

# システムプロンプト
SYSTEM_PROMPT = """あなたは個人開発者向けのタスク管理AIアシスタントです。
ユーザーの発言からタスクを抽出し、適切に管理をサポートしてください。

【重要なルール】
1. タスク作成が必要な場合は、必ず以下のJSON形式を含めてください：
   {"action": "create_task", "task": {"title": "タスク名", "priority": "high/medium/low"}}

2. タスク作成以外の質問（「何から始めるべき?」「この見積もりは妥当?」など）には、
   自然な会話で親身にアドバイスしてください。

3. 優先度の判断基準：
   - high: 期限が近い、重要度が高い、ブロッカーになる
   - medium: 通常のタスク
   - low: いつでもできる、優先度が低い

4. 簡潔で具体的なタスク名を提案してください（「ログイン機能の実装」など）

5. フレンドリーで励ましのある口調で応答してください。"""

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        # 現在のタスク状況を文脈に追加
        task_context = ""
        if req.tasks:
            todo_tasks = [t for t in req.tasks if t.status == "todo"]
            done_tasks = [t for t in req.tasks if t.status == "done"]
            task_context = f"\n\n【現在のタスク状況】\n未完了: {len(todo_tasks)}件\n完了: {len(done_tasks)}件"
            if todo_tasks:
                task_context += f"\n未完了タスク: {', '.join([t.title for t in todo_tasks[:5]])}"
      
        # プロンプト構築
        prompt = f"""{SYSTEM_PROMPT}
{task_context}

ユーザー: {req.message}

アシスタント:"""
      
        # Semantic Kernel実行
        result = await kernel.invoke_prompt(
            function_name="chat",
            plugin_name="chat_plugin",
            prompt=prompt
        )
      
        response_text = str(result)
      
        return ChatResponse(response=response_text)
  
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI処理エラー: {str(e)}")

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 2. Python環境構築（仮想環境推奨）

```bash
# backend/ ディレクトリで実行
python -m venv venv

# 仮想環境の有効化
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# 依存パッケージインストール
pip install -r requirements.txt
```

---

## 📝 README.md を作成

```markdown
# Project Companion MVP

AI対話でタスク管理ができる個人向けWebアプリ

## セットアップ

### 1. OpenAI APIキーの取得
- https://platform.openai.com/api-keys でAPIキーを取得
- `backend/.env` ファイルに `OPENAI_API_KEY=sk-...` を設定

### 2. バックエンド起動
\`\`\`bash
cd backend
source venv/bin/activate  # Windowsは venv\Scripts\activate
uvicorn main:app --reload
\`\`\`

### 3. フロントエンド起動
\`\`\`bash
cd frontend
npm run dev
\`\`\`

### 4. ブラウザで開く
http://localhost:5173

## 使い方
1. 右側のチャットで「明日までにログイン機能を作る」と入力
2. AIがタスクを自動生成
3. 左側のタスクリストでチェックボックスをクリックして完了

## 技術スタック
- Frontend: React + TypeScript + Tailwind CSS + Zustand
- Backend: FastAPI + Semantic Kernel + OpenAI GPT-4o-mini
```

---

## 📄 .gitignore を作成

```gitignore
# Frontend
frontend/node_modules/
frontend/dist/
frontend/.env

# Backend
backend/venv/
backend/__pycache__/
backend/.env
backend/*.pyc

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

---

## ✅ 動作確認手順

1. **バックエンド起動確認**

   ```bash
   cd backend
   uvicorn main:app --reload
   ```

   - ブラウザで http://localhost:8000/health を開く
   - `{"status":"ok","openai_configured":true}` が表示されればOK
2. **フロントエンド起動確認**

   ```bash
   cd frontend
   npm run dev
   ```

   - ブラウザで http://localhost:5173 を開く
   - UIが表示されればOK
3. **統合テスト**

   - チャットに「明日までにログイン機能を作る」と入力
   - タスクが左側に追加されればOK
   - チェックボックスで完了できればOK

---

## 🚨 トラブルシューティング

### エラー: `OPENAI_API_KEY が設定されていません`

→ `backend/.env` ファイルを作成し、APIキーを設定してください

### エラー: `Connection refused`

→ バックエンドが起動しているか確認してください（localhost:8000）

### タスクが追加されない

→ ブラウザのコンソールでエラーを確認してください
→ バックエンドのログを確認してください

---

## 📦 完了後の確認事項

- [ ] フロントエンドが http://localhost:5173 で起動する
- [ ] バックエンドが http://localhost:8000 で起動する
- [ ] チャットでメッセージを送信できる
- [ ] AIからの返答が表示される
- [ ] タスクが左側のリストに追加される
- [ ] チェックボックスで完了できる
- [ ] LocalStorageにデータが保存される（リロードしても残る）

すべて完了したら、MVPの基盤完成です！🎉

```

```
