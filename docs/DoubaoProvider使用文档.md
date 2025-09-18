# 豆包大模型服务提供者使用文档

## 概述

DoubaoProvider 是基于字节跳动ARK API的大模型服务提供者，支持文本生成、图片理解、视频理解、流式输出、深度推理等多种功能。

## 支持的模型

### 1. doubao-seed-1.6 (标准版本)
- **描述**: 豆包标准版本，平衡性能和质量
- **最大Token数**: 16384
- **支持功能**: 多模态、深度推理、流式输出

### 2. doubao-seed-1.6-flash (快速版本)
- **描述**: 豆包快速版本，优化响应速度
- **最大Token数**: 16384
- **支持功能**: 多模态、流式输出
- **注意**: 不支持深度推理功能

### 3. doubao-seed-1.6-thinking (深度推理版本)
- **描述**: 豆包深度推理版本，专注复杂推理任务
- **最大Token数**: 16384
- **支持功能**: 多模态、深度推理、流式输出

## 环境配置

### 环境变量设置
```bash
# 必需的环境变量
ARK_API_KEY=your_ark_api_key_here
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```

### 初始化Provider
```javascript
const DoubaoProvider = require('./src/services/providers/DoubaoProvider');

// 使用环境变量初始化
const provider = new DoubaoProvider();

// 或者使用配置对象初始化
const provider = new DoubaoProvider({
  apiKey: 'your_api_key',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3'
});
```

## 基础功能使用

### 1. 标准文本聊天

```javascript
// 基础文本聊天
const response = await provider.chatCompletion({
  model: 'doubao-seed-1.6',
  messages: [
    { role: 'system', content: '你是一个有用的AI助手' },
    { role: 'user', content: '你好，请介绍一下自己' }
  ],
  temperature: 0.7,
  max_tokens: 1000
});

console.log(response.choices[0].message.content);
```

### 2. 流式输出

```javascript
// 流式聊天
await provider.streamChatCompletion({
  model: 'doubao-seed-1.6',
  messages: [
    { role: 'user', content: '请写一首关于春天的诗' }
  ]
}, 
// onData回调 - 接收流式数据
(data) => {
  if (data.choices && data.choices[0].delta.content) {
    process.stdout.write(data.choices[0].delta.content);
  }
},
// onEnd回调 - 流结束
() => {
  console.log('\n流式输出完成');
},
// onError回调 - 错误处理
(error) => {
  console.error('流式输出错误:', error);
});
```

### 3. 深度推理功能

```javascript
// 启用深度推理
const response = await provider.chatWithThinking({
  model: 'doubao-seed-1.6-thinking',
  messages: [
    { role: 'user', content: '请分析一下量子计算的发展前景' }
  ],
  thinkingType: 'enabled'  // 'enabled' 或 'disabled'
});

// 深度推理版本会在响应中包含思考过程
console.log('思考过程:', response.choices[0].message.thinking);
console.log('最终回答:', response.choices[0].message.content);
```

## 多模态功能使用

### 1. 图片理解

#### 使用图片URL
```javascript
// 构建包含图片的消息
const imageMessage = provider.buildMultimodalMessage([
  provider.buildTextContent('请描述这张图片的内容'),
  provider.buildImageContent('https://example.com/image.jpg', 'high')
], 'user');

const response = await provider.chatWithImage({
  model: 'doubao-seed-1.6',
  messages: [imageMessage],
  imageDetail: 'high'  // 'high' 高质量 或 'low' 低质量
});
```

#### 使用Base64编码图片
```javascript
const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...';

const imageMessage = provider.buildMultimodalMessage([
  provider.buildTextContent('分析这张图片中的技术架构'),
  provider.buildImageContent(base64Image, 'high')
], 'user');

const response = await provider.chatWithImage({
  model: 'doubao-seed-1.6',
  messages: [imageMessage]
});
```

### 2. 视频理解

```javascript
// 视频理解
const videoMessage = provider.buildMultimodalMessage([
  provider.buildTextContent('请总结这个视频的主要内容'),
  provider.buildVideoContent('https://example.com/video.mp4', 2.0)  // fps=2.0
], 'user');

const response = await provider.chatWithVideo({
  model: 'doubao-seed-1.6',
  messages: [videoMessage],
  fps: 2.0  // 视频帧率，范围 0.2-5
});
```

## 高级配置选项

### 1. 完整参数配置

```javascript
const response = await provider.chatCompletion({
  model: 'doubao-seed-1.6',
  messages: messages,
  
  // 生成参数
  temperature: 0.8,        // 温度参数 (0-2)，控制随机性
  top_p: 0.9,             // top_p参数 (0-1)，控制多样性
  max_tokens: 4096,       // 最大生成token数
  
  // 功能开关
  stream: false,          // 是否流式输出
  encrypted: true,        // 是否加密传输
  
  // 深度推理配置
  thinking: { 
    type: 'enabled'       // 'enabled' 或 'disabled'
  }
});
```

### 2. 错误处理

```javascript
try {
  const response = await provider.chatCompletion({
    model: 'doubao-seed-1.6',
    messages: messages
  });
  
  console.log(response.choices[0].message.content);
} catch (error) {
  if (error.message.includes('API call failed')) {
    console.error('API调用失败:', error.message);
  } else if (error.message.includes('required')) {
    console.error('参数错误:', error.message);
  } else {
    console.error('未知错误:', error.message);
  }
}
```

## 实用工具方法

### 1. 获取模型信息

```javascript
// 获取模型详细信息
const modelInfo = provider.getModelInfo('doubao-seed-1.6');
console.log(modelInfo);
// 输出:
// {
//   name: 'doubao-seed-1.6',
//   description: '豆包标准版本，平衡性能和质量',
//   maxTokens: 16384,
//   supportMultimodal: true,
//   supportThinking: true,
//   supportStream: true
// }

// 获取所有支持的模型
const supportedModels = provider.getSupportedModels();
console.log(supportedModels);
// 输出: ['doubao-seed-1.6', 'doubao-seed-1.6-flash', 'doubao-seed-1.6-thinking']
```

### 2. 消息构建工具

```javascript
// 构建文本消息
const textMsg = provider.buildTextMessage('你好', 'user');

// 构建系统消息
const systemMsg = provider.buildTextMessage('你是一个专业的AI助手', 'system');

// 构建多模态消息
const multimodalMsg = provider.buildMultimodalMessage([
  provider.buildTextContent('请分析这张图片'),
  provider.buildImageContent('image_url_here', 'high')
], 'user');
```

## 完整使用示例

### 示例1: 智能客服对话

```javascript
const DoubaoProvider = require('./src/services/providers/DoubaoProvider');

async function customerService() {
  const provider = new DoubaoProvider();
  
  const messages = [
    provider.buildTextMessage('你是一个专业的客服助手，请友好地回答用户问题', 'system'),
    provider.buildTextMessage('我想了解你们的退货政策', 'user')
  ];
  
  try {
    const response = await provider.chatCompletion({
      model: 'doubao-seed-1.6-flash',  // 使用快速版本
      messages: messages,
      temperature: 0.3,  // 较低温度保证回答准确性
      max_tokens: 1000
    });
    
    console.log('客服回复:', response.choices[0].message.content);
  } catch (error) {
    console.error('客服对话失败:', error.message);
  }
}
```

### 示例2: 图片分析应用

```javascript
async function analyzeImage(imageUrl, question) {
  const provider = new DoubaoProvider();
  
  const message = provider.buildMultimodalMessage([
    provider.buildTextContent(question),
    provider.buildImageContent(imageUrl, 'high')
  ], 'user');
  
  try {
    const response = await provider.chatWithImage({
      model: 'doubao-seed-1.6',
      messages: [message],
      imageDetail: 'high',
      temperature: 0.5
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    throw new Error(`图片分析失败: ${error.message}`);
  }
}

// 使用示例
analyzeImage('https://example.com/chart.png', '请分析这个图表的数据趋势')
  .then(result => console.log('分析结果:', result))
  .catch(error => console.error(error.message));
```

### 示例3: 复杂推理任务

```javascript
async function complexReasoning(problem) {
  const provider = new DoubaoProvider();
  
  const messages = [
    provider.buildTextMessage('你是一个逻辑推理专家，请仔细分析问题并给出详细的推理过程', 'system'),
    provider.buildTextMessage(problem, 'user')
  ];
  
  try {
    const response = await provider.chatWithThinking({
      model: 'doubao-seed-1.6-thinking',  // 使用深度推理版本
      messages: messages,
      thinkingType: 'enabled',
      temperature: 0.1,  // 低温度确保推理准确性
      max_tokens: 4000
    });
    
    console.log('推理过程:', response.choices[0].message.thinking);
    console.log('最终答案:', response.choices[0].message.content);
    
    return response;
  } catch (error) {
    throw new Error(`推理任务失败: ${error.message}`);
  }
}
```

## 注意事项

1. **API密钥安全**: 请妥善保管您的ARK_API_KEY，不要在代码中硬编码
2. **模型选择**: 根据任务需求选择合适的模型版本
   - 快速响应: `doubao-seed-1.6-flash`
   - 平衡性能: `doubao-seed-1.6`
   - 复杂推理: `doubao-seed-1.6-thinking`
3. **图片格式**: 支持常见图片格式，建议使用JPG、PNG格式
4. **视频处理**: 视频文件大小和时长有限制，具体请参考官方文档
5. **流式输出**: 使用流式输出时注意正确处理回调函数
6. **错误处理**: 建议在生产环境中实现完善的错误处理机制

## 性能优化建议

1. **合理设置max_tokens**: 根据实际需求设置，避免不必要的token消耗
2. **选择合适的temperature**: 创意任务使用较高值(0.7-1.0)，准确性任务使用较低值(0.1-0.3)
3. **图片质量选择**: 简单识别任务使用'low'，复杂分析使用'high'
4. **流式输出**: 对于长文本生成，建议使用流式输出提升用户体验
5. **缓存策略**: 对于相同的请求可以考虑实现缓存机制

## 常见问题

### Q: 如何处理API调用超时？
A: 可以在axios配置中设置timeout参数，或者使用Promise.race实现超时控制。

### Q: 支持哪些图片格式？
A: 支持JPG、PNG、GIF、WebP等常见格式，也支持Base64编码的图片。

### Q: 流式输出如何知道结束？
A: 当接收到`[DONE]`标记或者onEnd回调被调用时，表示流式输出结束。

### Q: 深度推理功能什么时候使用？
A: 适用于需要复杂逻辑推理、数学计算、代码分析等需要"思考过程"的任务。