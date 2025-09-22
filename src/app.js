const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
require('dotenv').config();

const connectDB = require('./config/database');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB();

// 中间件
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(morgan('combined')); // 日志记录
app.use(bodyParser.json({ limit: '10mb' })); // 解析JSON请求体
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' })); // 解析URL编码请求体

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'Agent Builder Server API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      chat: '/api/chat',
      users: '/api/users'
    },
    documentation: {
      chat: {
        'POST /api/chat/simple': 'Simple text chat',
        'POST /api/chat/image': 'Image and text chat',
        'POST /api/chat/completions': 'Full chat completions',
        'GET /api/chat/conversations/:userId': 'Get user conversations',
        'GET /api/chat/conversation/:id': 'Get specific conversation'
      },
      users: {
        'POST /api/users': 'Create user',
        'GET /api/users': 'Get all users',
        'GET /api/users/:id': 'Get specific user',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user'
      }
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📖 API Documentation available at http://localhost:${PORT}`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
  console.log(`🤖 Chat API available at http://localhost:${PORT}/api/chat`);
  console.log(`👥 Users API available at http://localhost:${PORT}/api/users`);
});

module.exports = app;