# 用户管理接口文档

## 接口概述

用户管理模块提供用户注册、登录、身份验证、查询、更新和删除功能。所有接口返回统一的JSON格式响应。

## 身份验证

部分接口需要身份验证，需要在请求头中包含JWT token：

```
Authorization: Bearer <your_jwt_token>
```

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功提示" (可选)
}
```

### 错误响应
```json
{
  "error": "错误描述",
  "details": "详细错误信息" (可选)
}
```

## 接口详情

### 1. 用户登录

**接口地址**: `POST /api/users/login`

**功能**: 用户登录获取JWT token

**请求体**:
```json
{
  "email": "邮箱地址",
  "password": "密码"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "用户ID",
      "username": "用户名",
      "email": "邮箱地址",
      "apiKey": "API密钥",
      "isActive": true,
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    },
    "token": "JWT_TOKEN",
    "expiresIn": "24h"
  }
}
```

**错误响应**:
- 400: 缺少邮箱或密码
- 401: 邮箱或密码错误，或账户未激活
- 500: 服务器内部错误

### 2. 用户登出

**接口地址**: `POST /api/users/logout`

**功能**: 用户登出

**身份验证**: 需要

**成功响应** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**错误响应**:
- 401: 未授权或token无效
- 500: 服务器内部错误

### 3. 获取当前用户信息

**接口地址**: `GET /api/users/me`

**功能**: 获取当前登录用户的信息

**身份验证**: 需要

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "_id": "用户ID",
    "username": "用户名",
    "email": "邮箱地址",
    "apiKey": "API密钥",
    "isActive": true,
    "createdAt": "创建时间",
    "updatedAt": "更新时间"
  }
}
```

**错误响应**:
- 401: 未授权或token无效
- 500: 服务器内部错误

### 4. 创建用户（注册）

**接口地址**: `POST /api/users`

**功能**: 创建新用户

**请求体**:
```json
{
  "username": "用户名",
  "email": "邮箱地址",
  "password": "密码",
  "apiKey": "API密钥" (可选)
}
```

**验证规则**:
- username: 必填，唯一，3-30字符
- email: 必填，唯一，有效邮箱格式
- password: 必填，最少6字符
- apiKey: 可选

**成功响应** (201):
```json
{
  "success": true,
  "data": {
    "_id": "用户ID",
    "username": "用户名",
    "email": "邮箱地址",
    "apiKey": "API密钥",
    "isActive": true,
    "createdAt": "创建时间",
    "updatedAt": "更新时间"
  }
}
```

**错误响应**:
- 400: 缺少必填字段
- 409: 用户名或邮箱已存在
- 500: 服务器内部错误

### 2. 获取用户列表

**接口地址**: `GET /api/users`

**功能**: 分页获取活跃用户列表

**查询参数**:
- `page`: 页码，默认为1
- `limit`: 每页数量，默认为10

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "用户ID",
        "username": "用户名",
        "email": "邮箱地址",
        "apiKey": "API密钥",
        "isActive": true,
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 总用户数,
      "pages": 总页数
    }
  }
}
```

**错误响应**:
- 500: 服务器内部错误

### 3. 获取单个用户

**接口地址**: `GET /api/users/:id`

**功能**: 根据ID获取用户详情

**路径参数**:
- `id`: 用户ID

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "_id": "用户ID",
    "username": "用户名",
    "email": "邮箱地址",
    "apiKey": "API密钥",
    "isActive": true,
    "createdAt": "创建时间",
    "updatedAt": "更新时间"
  }
}
```

**错误响应**:
- 404: 用户不存在
- 500: 服务器内部错误

### 4. 更新用户

**接口地址**: `PUT /api/users/:id`

**功能**: 更新用户信息

**路径参数**:
- `id`: 用户ID

**请求体**:
```json
{
  "username": "新用户名" (可选),
  "email": "新邮箱" (可选),
  "apiKey": "新API密钥" (可选),
  "isActive": true/false (可选)
}
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "_id": "用户ID",
    "username": "用户名",
    "email": "邮箱地址",
    "apiKey": "API密钥",
    "isActive": true,
    "createdAt": "创建时间",
    "updatedAt": "更新时间"
  }
}
```

**错误响应**:
- 404: 用户不存在
- 500: 服务器内部错误

### 5. 删除用户（软删除）

**接口地址**: `DELETE /api/users/:id`

**功能**: 软删除用户（将isActive设为false）

**路径参数**:
- `id`: 用户ID

**成功响应** (200):
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "_id": "用户ID",
    "username": "用户名",
    "email": "邮箱地址",
    "apiKey": "API密钥",
    "isActive": false,
    "createdAt": "创建时间",
    "updatedAt": "更新时间"
  }
}
```

**错误响应**:
- 404: 用户不存在
- 500: 服务器内部错误

## 代码问题分析

### 1. 安全问题
- **密码未加密**: 代码中直接将明文密码存储到数据库，这是严重的安全隐患
- **缺少输入验证**: 除了基本的必填验证外，缺少对输入格式的详细验证

### 2. 功能问题
- **邮箱格式验证**: 缺少邮箱格式验证
- **用户名格式验证**: 缺少用户名格式验证（如特殊字符限制）
- **分页参数验证**: 缺少对page和limit参数的合理性验证

### 3. 代码结构问题
- **错误处理**: 错误响应格式不够统一，有些接口缺少详细的错误信息
- **重复代码**: 用户查询逻辑有重复，可以提取公共方法

## 改进建议

### 1. 密码安全
```javascript
// 使用bcrypt进行密码哈希
const bcrypt = require('bcrypt');
const saltRounds = 10;

// 在创建用户时
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### 2. 输入验证
```javascript
// 添加邮箱格式验证
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: 'Invalid email format' });
}

// 添加用户名格式验证
const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
if (!usernameRegex.test(username)) {
  return res.status(400).json({ error: 'Username must be 3-30 characters, alphanumeric and underscore only' });
}
```

### 3. 分页参数验证
```javascript
const page = Math.max(1, parseInt(req.query.page) || 1);
const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
```

## Postman Curl 命令集合

### 基础配置
确保将以下curl命令中的 `localhost:3000` 替换为你的实际服务器地址和端口。

---

### 1. 创建用户

#### 成功创建用户
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "apiKey": "your-api-key-here"
  }'
```

#### 创建用户（缺少必填字段）
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com"
  }'
```

#### 创建用户（重复用户名/邮箱）
```bash
# 先创建第一个用户
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "duplicate",
    "email": "duplicate@example.com",
    "password": "password123"
  }'

# 再尝试创建重复用户
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "duplicate",
    "email": "another@example.com",
    "password": "password123"
  }'
```

---

### 2. 获取用户列表

#### 获取默认分页用户列表
```bash
curl -X GET "http://localhost:3000/api/users" \
  -H "Accept: application/json"
```

#### 获取指定分页用户列表
```bash
curl -X GET "http://localhost:3000/api/users?page=2&limit=5" \
  -H "Accept: application/json"
```

#### 获取所有用户（设置较大限制）
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=100" \
  -H "Accept: application/json"
```

---

### 3. 获取单个用户

#### 获取存在的用户
```bash
curl -X GET "http://localhost:3000/api/users/1234567890abcdef12345678" \
  -H "Accept: application/json"
```

#### 获取不存在的用户
```bash
curl -X GET "http://localhost:3000/api/users/507f1f77bcf86cd799439011" \
  -H "Accept: application/json"
```

#### 获取无效ID格式的用户
```bash
curl -X GET "http://localhost:3000/api/users/invalid-id" \
  -H "Accept: application/json"
```

---

### 4. 更新用户

#### 更新用户名
```bash
curl -X PUT "http://localhost:3000/api/users/1234567890abcdef12345678" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "username": "newusername"
  }'
```

#### 更新邮箱
```bash
curl -X PUT "http://localhost:3000/api/users/1234567890abcdef12345678" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "newemail@example.com"
  }'
```

#### 更新多个字段
```bash
curl -X PUT "http://localhost:3000/api/users/1234567890abcdef12345678" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "username": "updateduser",
    "email": "updated@example.com",
    "apiKey": "new-api-key",
    "isActive": false
  }'
```

#### 禁用用户
```bash
curl -X PUT "http://localhost:3000/api/users/1234567890abcdef12345678" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "isActive": false
  }'
```

#### 更新不存在的用户
```bash
curl -X PUT "http://localhost:3000/api/users/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "username": "nonexistent"
  }'
```

---

### 5. 删除用户（软删除）

#### 删除存在的用户
```bash
curl -X DELETE "http://localhost:3000/api/users/1234567890abcdef12345678" \
  -H "Accept: application/json"
```

#### 删除不存在的用户
```bash
curl -X DELETE "http://localhost:3000/api/users/507f1f77bcf86cd799439011" \
  -H "Accept: application/json"
```

---

### 6. 批量操作示例

#### 创建多个测试用户
```bash
# 用户1
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user1",
    "email": "user1@example.com",
    "password": "password123"
  }'

# 用户2
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user2",
    "email": "user2@example.com",
    "password": "password123"
  }'

# 用户3
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user3",
    "email": "user3@example.com",
    "password": "password123"
  }'
```

#### 获取创建的用户列表
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Accept: application/json"
```

---

### 7. 错误处理测试

#### 测试各种错误情况
```bash
# 空请求体
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{}'

# 无效邮箱格式
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "invalid-email",
    "password": "password123"
  }'

# 用户名太短
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "email": "test@example.com",
    "password": "password123"
  }'

# 密码太短
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "123"
  }'
```

---

### Postman 环境变量设置

在Postman中设置环境变量，方便切换不同环境：

```
baseUrl: http://localhost:3000
apiPrefix: /api
```

然后在Postman中使用：
```
{{baseUrl}}{{apiPrefix}}/users
```

### 响应验证

所有成功的响应都应该包含：
- HTTP状态码：200, 201
- 响应体中的 `success: true`
- 相应的数据在 `data` 字段中

错误响应包含：
- 适当的HTTP状态码：400, 404, 409, 500
- 错误描述在 `error` 字段中
- 详细信息在 `details` 字段中（可选）