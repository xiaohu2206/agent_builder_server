const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User');

async function listCollections() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('错误：未在 .env 文件中找到 MONGODB_URI');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (collectionNames.length === 0) {
      console.log('数据库中没有找到任何集合。');
    } else {
      console.log('数据库中的集合列表：');
      collectionNames.forEach(name => console.log(`- ${name}`));
    }

    console.log('\n--- 查看用户表的所有数据 ---');
    const users = await User.find({});
    if (users.length === 0) {
      console.log('用户表中没有数据。');
    } else {
      console.log('用户表中的所有数据：');
      console.log(JSON.stringify(users, null, 2));
    }

  } catch (error) {
    console.error('查询集合失败:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

listCollections();