# MongoDB 安装和配置指南

## 方法一：使用 Docker（推荐）

### 前提条件
1. 安装 Docker Desktop for Windows
2. 确保 Docker 服务正在运行

### 安装步骤

1. **启动 MongoDB 服务**
   ```bash
   docker-compose up -d
   ```

2. **验证安装**
   ```bash
   docker ps
   ```
   应该看到 `agent_builder_mongodb` 容器正在运行

3. **连接到 MongoDB**
   - 主机: `localhost`
   - 端口: `27017`
   - 数据库: `agent_builder`
   - 用户名: `app_user`
   - 密码: `app_password`

### 管理命令

- **停止服务**: `docker-compose down`
- **查看日志**: `docker-compose logs mongodb`
- **重启服务**: `docker-compose restart mongodb`

## 方法二：本地安装

### 下载和安装

1. **下载 MongoDB Community Server**
   - 访问: https://www.mongodb.com/try/download/community
   - 选择 Windows 版本
   - 下载 MSI 安装包

2. **安装步骤**
   - 运行下载的 MSI 文件
   - 选择 "Complete" 安装
   - 勾选 "Install MongoDB as a Service"
   - 设置数据目录（默认: C:\data\db）

3. **启动服务**
   ```bash
   net start MongoDB
   ```

### 配置环境变量

将 MongoDB 的 bin 目录添加到系统 PATH：
- 默认路径: `C:\Program Files\MongoDB\Server\7.0\bin`

## 数据库连接配置

项目中的数据库连接字符串：

### Docker 方式
```javascript
mongodb://app_user:app_password@localhost:27017/agent_builder
```

### 本地安装方式
```javascript
mongodb://localhost:27017/agent_builder
```

## 验证连接

运行以下命令测试连接：

```bash
# 使用 MongoDB Shell 连接
mongosh "mongodb://localhost:27017/agent_builder"

# 或者使用认证连接（Docker 方式）
mongosh "mongodb://app_user:app_password@localhost:27017/agent_builder"
```

## 数据库结构

项目包含以下集合：

1. **users** - 用户信息
   - username (string, unique)
   - email (string, unique)
   - password (string)
   - apiKey (string, optional)
   - isActive (boolean)

2. **conversations** - 对话记录
   - userId (ObjectId, 引用 users)
   - title (string)
   - messages (array)
   - model (string)
   - isActive (boolean)

## 故障排除

### 常见问题

1. **端口被占用**
   - 检查端口 27017 是否被其他服务占用
   - 使用 `netstat -an | findstr 27017` 检查

2. **权限问题**
   - 确保以管理员身份运行命令
   - 检查数据目录的写入权限

3. **服务无法启动**
   - 检查 Windows 服务中的 MongoDB 状态
   - 查看事件查看器中的错误日志

### 有用的命令

```bash
# 检查 MongoDB 服务状态
sc query MongoDB

# 启动 MongoDB 服务
net start MongoDB

# 停止 MongoDB 服务
net stop MongoDB

# 查看 MongoDB 进程
tasklist | findstr mongod
```