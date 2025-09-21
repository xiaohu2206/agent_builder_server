const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // 支持多种连接方式
    const mongoUri = process.env.MONGODB_URI || 
                     process.env.MONGODB_URL || 
                     'mongodb://app_user:app_password@localhost:27017/agent_builder' || // Docker 方式
                     'mongodb://localhost:27017/agent_builder'; // 本地安装方式

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // 添加更多连接选项
      maxPoolSize: 10, // 连接池大小
      serverSelectionTimeoutMS: 5000, // 服务器选择超时
      socketTimeoutMS: 45000, // Socket 超时
      bufferMaxEntries: 0, // 禁用 mongoose 缓冲
      bufferCommands: false, // 禁用 mongoose 缓冲
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    // 监听连接事件
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

  } catch (error) {
    console.error('Database connection error:', error.message);
    console.error('Please ensure MongoDB is running and accessible');
    console.error('For Docker: run "docker-compose up -d"');
    console.error('For local installation: run "net start MongoDB"');
    process.exit(1);
  }
};

module.exports = connectDB;