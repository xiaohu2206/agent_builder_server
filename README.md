# Agent Builder Server

一个基于 Node.js 的后端服务项目，集成了 MongoDB 数据库和火山方舟大模型 API 调用功能。

## 功能特性

- 🚀 Express.js 服务器框架
- 🗄️ MongoDB 数据库集成
- 🤖 火山方舟大模型 API 调用
- 👥 用户管理系统
- 💬 对话记录存储
- 🔒 安全中间件集成
- 📝 完整的 API 文档

## 项目结构

```
agent_builder_server/
├── src/
│   ├── config/
│   │   └── database.js          # 数据库配置
│   ├── models/
│   │   ├── User.js              # 用户数据模型
│   │   └── Conversation.js      # 对话记录模型
│   ├── routes/
│   │   ├── chat.js              # 聊天相关路由
│   │   └── users.js             # 用户管理路由
│   ├── services/
│   │   └── llmService.js        # 大模型API服务
│   └── app.js                   # 主应用程序
├── .env.example                 # 环境变量示例
├── .gitignore                   # Git忽略文件
├── package.json                 # 项目配置
└── README.md                    # 项目文档
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env` 并填入相应配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/agent_builder

# 火山方舟大模型API配置
ARK_API_KEY=你的API密钥
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3

# 默认模型端点ID
DEFAULT_MODEL_ENDPOINT=你的端点ID
```

### 3. 启动 MongoDB

确保 MongoDB 服务正在运行：

```bash
# macOS (使用 Homebrew)
brew services start mongodb-community

# 或者直接启动
mongod
```

### 4. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API 文档

### 基础端点

- `GET /` - API 文档和端点列表
- `GET /health` - 健康检查

### 用户管理 API

#### 创建用户
```http
POST /api/users
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "apiKey": "optional_api_key"
}
```

#### 获取用户列表
```http
GET /api/users?page=1&limit=10
```

#### 获取特定用户
```http
GET /api/users/:id
```

#### 更新用户
```http
PUT /api/users/:id
Content-Type: application/json

{
  "username": "newusername",
  "apiKey": "new_api_key"
}
```

#### 删除用户
```http
DELETE /api/users/:id
```

### 聊天 API

#### 简单文本聊天
```http
POST /api/chat/simple
Content-Type: application/json

{
  "model": "你的端点ID",
  "message": "你好，请介绍一下自己",
  "systemMessage": "你是一个有用的AI助手"
}


curl --location 'http://localhost:3000/api/chat/simple' \
--header 'Content-Type: application/json' \
--data '{
    "model": "doubao-1-5-pro-32k-250115",
    "message": "Hello, how are you?"
  }'
```

#### 图片和文本混合聊天
```http
POST /api/chat/image
Content-Type: application/json

{
  "model": "你的端点ID",
  "imageUrl": "https://example.com/image.jpg",
  "text": "这张图片里有什么？",
  "temperature": 1,
  "top_p": 0.7,
  "max_tokens": 32768
}
```

#### 完整聊天对话
```http
POST /api/chat/completions
Content-Type: application/json

{
  "model": "你的端点ID",
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ],
  "temperature": 1,
  "top_p": 0.7,
  "max_tokens": 32768,
  "thinking": {"type": "enabled"},
  "encrypted": true,
  "userId": "用户ID",
  "saveConversation": true
}
```

#### 获取对话历史
```http
GET /api/chat/conversations/:userId?page=1&limit=10
```

#### 获取特定对话
```http
GET /api/chat/conversation/:id
```

## 火山方舟大模型集成

本项目集成了火山方舟大模型 API，支持：

- ✅ 文本对话
- ✅ 图片理解（Doubao-vision 系列）
- ✅ 流式和非流式响应
- ✅ 应用层端到端加密
- ✅ 思维链推理

### 获取 API Key

1. 访问 [火山方舟控制台](https://console.volcengine.com/ark)
2. 创建应用并获取 API Key
3. 在推理接入页面创建端点并获取端点 ID

### 使用示例

参考 Python 调用示例的 Node.js 实现已集成在 `src/services/llmService.js` 中。

## 数据库模型

### User 模型
```javascript
{
  username: String,     // 用户名
  email: String,        // 邮箱
  password: String,     // 密码
  apiKey: String,       // API密钥
  isActive: Boolean,    // 是否激活
  createdAt: Date,      // 创建时间
  updatedAt: Date       // 更新时间
}
```

### Conversation 模型
```javascript
{
  userId: ObjectId,     // 用户ID
  title: String,        // 对话标题
  messages: [           // 消息列表
    {
      role: String,     // 角色：user/assistant/system
      content: Mixed,   // 消息内容
      timestamp: Date   // 时间戳
    }
  ],
  model: String,        // 使用的模型
  isActive: Boolean,    // 是否激活
  createdAt: Date,      // 创建时间
  updatedAt: Date       // 更新时间
}
```

## 开发

### 安装开发依赖

```bash
npm install --save-dev
```

### 开发模式启动

```bash
npm run dev
```

这将使用 `nodemon` 启动服务器，文件变更时自动重启。

## 部署

### 环境要求

- Node.js 16+
- MongoDB 4.4+
- 火山方舟 API Key

### 生产环境配置

1. 设置环境变量 `NODE_ENV=production`
2. 配置生产数据库连接
3. 设置安全的 JWT 密钥
4. 配置反向代理（如 Nginx）

## 安全注意事项

- ⚠️ 密码存储：当前版本未对密码进行哈希处理，生产环境请使用 bcrypt
- 🔐 API Key：确保 API Key 安全存储，不要提交到版本控制
- 🛡️ 输入验证：对所有用户输入进行验证和清理
- 🔒 HTTPS：生产环境请使用 HTTPS

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！