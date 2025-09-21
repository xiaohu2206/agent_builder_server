const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User');
const Conversation = require('../src/models/Conversation');

// 测试数据库连接和基本操作
async function testDatabaseConnection() {
  try {
    console.log('🔄 正在测试数据库连接...');
    
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 
                     'mongodb://app_user:app_password@localhost:27017/agent_builder';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ 数据库连接成功!');
    console.log(`📍 连接地址: ${mongoose.connection.host}`);
    console.log(`📊 数据库名: ${mongoose.connection.name}`);

    // 测试创建用户
    console.log('\n🔄 测试创建用户...');
    const testUser = new User({
      username: 'testuser_' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      apiKey: 'test-api-key',
      isActive: true
    });

    const savedUser = await testUser.save();
    console.log('✅ 用户创建成功!');
    console.log(`👤 用户ID: ${savedUser._id}`);
    console.log(`📧 邮箱: ${savedUser.email}`);

    // 测试创建对话
    console.log('\n🔄 测试创建对话...');
    const testConversation = new Conversation({
      userId: savedUser._id,
      title: '测试对话',
      messages: [
        {
          role: 'user',
          content: '你好，这是一条测试消息',
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: '你好！我是AI助手，很高兴为您服务。',
          timestamp: new Date()
        }
      ],
      model: 'gpt-3.5-turbo',
      isActive: true
    });

    const savedConversation = await testConversation.save();
    console.log('✅ 对话创建成功!');
    console.log(`💬 对话ID: ${savedConversation._id}`);
    console.log(`📝 消息数量: ${savedConversation.messages.length}`);

    // 测试查询
    console.log('\n🔄 测试数据查询...');
    const userCount = await User.countDocuments();
    const conversationCount = await Conversation.countDocuments();
    
    console.log(`👥 用户总数: ${userCount}`);
    console.log(`💬 对话总数: ${conversationCount}`);

    // 清理测试数据
    console.log('\n🔄 清理测试数据...');
    await User.findByIdAndDelete(savedUser._id);
    await Conversation.findByIdAndDelete(savedConversation._id);
    console.log('✅ 测试数据清理完成!');

    console.log('\n🎉 所有测试通过! 数据库配置正确。');

  } catch (error) {
    console.error('\n❌ 数据库测试失败:');
    console.error('错误信息:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('\n💡 可能的解决方案:');
      console.error('1. 确保 MongoDB 服务正在运行');
      console.error('2. 检查连接字符串是否正确');
      console.error('3. 如果使用 Docker: 运行 "docker-compose up -d"');
      console.error('4. 如果本地安装: 运行 "net start MongoDB"');
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行测试
if (require.main === module) {
  testDatabaseConnection();
}

module.exports = testDatabaseConnection;