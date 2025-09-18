const axios = require('axios');
const BaseLLMProvider = require('./BaseLLMProvider');

/**
 * 豆包大模型服务提供者
 * 基于字节跳动ARK API
 * 支持文本生成、图片理解、流式输出、深度推理等功能
 */
class DoubaoProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super(config);
    
    this.baseURL = config.baseURL || process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    this.apiKey = config.apiKey || process.env.ARK_API_KEY;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // this.validateConfig();
  }

  // validateConfig() {
  //   if (!this.apiKey) {
  //     throw new Error('ARK_API_KEY is required for DoubaoProvider');
  //   }
  //   if (!this.baseURL) {
  //     throw new Error('ARK_BASE_URL is required for DoubaoProvider');
  //   }
  // }

  /**
   * 标准聊天完成接口
   * @param {Object} options - 聊天选项
   * @param {string} options.model - 模型名称或endpoint ID
   * @param {Array} options.messages - 消息数组
   * @param {number} options.temperature - 温度参数 (0-2)
   * @param {number} options.top_p - top_p参数 (0-1)
   * @param {number} options.max_tokens - 最大token数
   * @param {boolean} options.stream - 是否流式输出
   * @param {Object} options.thinking - 深度推理配置
   * @param {boolean} options.encrypted - 是否加密传输
   * @param {Function} onData - 流式输出数据回调函数 (仅在stream=true时使用)
   * @param {Function} onEnd - 流式输出结束回调函数 (仅在stream=true时使用)
   * @param {Function} onError - 流式输出错误回调函数 (仅在stream=true时使用)
   * @returns {Promise<Object>} 聊天响应 (非流式) 或 Promise<void> (流式)
   */
  async chatCompletion(options = {}, onData, onEnd, onError) {
    const {
      model,
      messages,
      temperature = 1,
      top_p = 0.7,
      max_tokens = 16384,
      thinking = { type: 'enabled' },
      stream = false,
      encrypted = true
    } = options;

    if (!model) {
      throw new Error('Model endpoint ID is required');
    }

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const requestData = {
      model,
      messages,
      temperature,
      top_p,
      max_tokens,
      thinking,
      stream
    };

    const headers = {};
    if (encrypted) {
      headers['x-is-encrypted'] = 'true';
    }
    
    try {
      const response = await this.client.post('/chat/completions', requestData, {
        headers,
        responseType: stream ? 'stream' : 'json'
      });
      
      if (stream) {
        // 流式输出处理
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                onEnd && onEnd();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                onData && onData(parsed);
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        });

        response.data.on('end', () => {
          onEnd && onEnd();
        });

        response.data.on('error', (error) => {
          onError && onError(error);
        });
      } else {
        // 非流式输出
        return response.data;
      }
    } catch (error) {
      console.error('Doubao API Error:', error.response?.data || error.message);
      const errorMessage = `Doubao API call failed: ${error.response?.data?.error?.message || error.message}`;
      if (stream && onError) {
        onError(new Error(errorMessage));
      } else {
        throw new Error(errorMessage);
      }
    }
  }



  /**
   * 图片理解聊天
   * @param {Object} options - 聊天选项
   * @param {string} options.model - 模型名称
   * @param {Array} options.messages - 包含图片的消息数组
   * @param {string} options.imageDetail - 图片质量 ('high' | 'low')
   * @param {Function} onData - 流式输出数据回调函数 (仅在stream=true时使用)
   * @param {Function} onEnd - 流式输出结束回调函数 (仅在stream=true时使用)
   * @param {Function} onError - 流式输出错误回调函数 (仅在stream=true时使用)
   * @returns {Promise<Object>} 聊天响应 (非流式) 或 Promise<void> (流式)
   */
  async chatWithImage(options = {}, onData, onEnd, onError) {
    const { imageDetail = 'low', ...otherOptions } = options;
    
    // 处理消息中的图片
    const processedMessages = options.messages.map(message => {
      if (message.content && Array.isArray(message.content)) {
        return {
          ...message,
          content: message.content.map(content => {
            if (content.type === 'image_url' && content.image_url) {
              return {
                ...content,
                image_url: {
                  ...content.image_url,
                  detail: imageDetail
                }
              };
            }
            return content;
          })
        };
      }
      return message;
    });

    return this.chatCompletion({
      ...otherOptions,
      messages: processedMessages
    }, onData, onEnd, onError);
  }

  /**
   * 深度推理聊天
   * @param {Object} options - 聊天选项
   * @param {string} thinkingType - 思维类型 ('enabled', 'disabled')
   * @param {Function} onData - 流式输出数据回调函数 (仅在stream=true时使用)
   * @param {Function} onEnd - 流式输出结束回调函数 (仅在stream=true时使用)
   * @param {Function} onError - 流式输出错误回调函数 (仅在stream=true时使用)
   * @returns {Promise<Object>} 聊天响应 (非流式) 或 Promise<void> (流式)
   */
  async chatWithThinking(options = {}, onData, onEnd, onError) {
    const { thinkingType = 'enabled', ...otherOptions } = options;
    
    return this.chatCompletion({
      ...otherOptions,
      thinking: { type: thinkingType }
    }, onData, onEnd, onError);
  }

  /**
   * 视频理解聊天
   * @param {Object} options - 聊天选项
   * @param {number} options.fps - 视频帧率 (0.2-5)
   * @param {Function} onData - 流式输出数据回调函数 (仅在stream=true时使用)
   * @param {Function} onEnd - 流式输出结束回调函数 (仅在stream=true时使用)
   * @param {Function} onError - 流式输出错误回调函数 (仅在stream=true时使用)
   * @returns {Promise<Object>} 聊天响应 (非流式) 或 Promise<void> (流式)
   */
  async chatWithVideo(options = {}, onData, onEnd, onError) {
    const { fps = 1, ...otherOptions } = options;
    
    // 处理消息中的视频
    const processedMessages = options.messages.map(message => {
      if (message.content && Array.isArray(message.content)) {
        return {
          ...message,
          content: message.content.map(content => {
            if (content.type === 'video_url' && content.video_url) {
              return {
                ...content,
                video_url: {
                  ...content.video_url,
                  fps: fps
                }
              };
            }
            return content;
          })
        };
      }
      return message;
    });

    return this.chatCompletion({
      ...otherOptions,
      messages: processedMessages
    }, onData, onEnd, onError);
  }

  getProviderName() {
    return 'doubao';
  }

  getSupportedModels() {
    return [
      'doubao-seed-1.6',          // 标准版本
      'doubao-seed-1.6-flash',    // 快速版本
      'doubao-seed-1.6-thinking', // 深度推理版本
    ];
  }

  /**
   * 获取模型信息
   * @param {string} modelName - 模型名称
   * @returns {Object} 模型信息
   */
  getModelInfo(modelName) {
    const modelInfoMap = {
      'doubao-seed-1.6': {
        name: 'doubao-seed-1.6',
        description: '豆包标准版本，平衡性能和质量',
        maxTokens: 16384,
        supportMultimodal: true,
        supportThinking: true,
        supportStream: true
      },
      'doubao-seed-1.6-flash': {
        name: 'doubao-seed-1.6-flash',
        description: '豆包快速版本，优化响应速度',
        maxTokens: 16384,
        supportMultimodal: true,
        supportThinking: false,
        supportStream: true
      },
      'doubao-seed-1.6-thinking': {
        name: 'doubao-seed-1.6-thinking',
        description: '豆包深度推理版本，专注复杂推理任务',
        maxTokens: 16384,
        supportMultimodal: true,
        supportThinking: true,
        supportStream: true
      }
    };

    return modelInfoMap[modelName] || null;
  }

  /**
   * 构建文本消息
   * @param {string} text - 文本内容
   * @param {string} role - 角色 ('user' | 'assistant' | 'system')
   * @returns {Object} 消息对象
   */
  buildTextMessage(text, role = 'user') {
    return {
      role,
      content: text
    };
  }

  /**
   * 构建多模态消息
   * @param {Array} contents - 内容数组
   * @param {string} role - 角色 ('user' | 'assistant' | 'system')
   * @returns {Object} 消息对象
   */
  buildMultimodalMessage(contents, role = 'user') {
    return {
      role,
      content: contents
    };
  }

  /**
   * 构建图片内容
   * @param {string} imageUrl - 图片URL或Base64
   * @param {string} detail - 图片质量 ('high' | 'low')
   * @returns {Object} 图片内容对象
   */
  buildImageContent(imageUrl, detail = 'low') {
    return {
      type: 'image_url',
      image_url: {
        url: imageUrl,
        detail: detail
      }
    };
  }

  /**
   * 构建视频内容
   * @param {string} videoUrl - 视频URL或Base64
   * @param {number} fps - 帧率
   * @returns {Object} 视频内容对象
   */
  buildVideoContent(videoUrl, fps = 1) {
    return {
      type: 'video_url',
      video_url: {
        url: videoUrl,
        fps: fps
      }
    };
  }

  /**
   * 构建文本内容
   * @param {string} text - 文本内容
   * @returns {Object} 文本内容对象
   */
  buildTextContent(text) {
    return {
      type: 'text',
      text: text
    };
  }
}

module.exports = DoubaoProvider;