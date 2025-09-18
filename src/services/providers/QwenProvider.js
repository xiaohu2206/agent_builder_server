const axios = require('axios');
const BaseLLMProvider = require('./BaseLLMProvider');

/**
 * 千问大模型服务提供者
 * 基于阿里云千问API
 */
class QwenProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super(config);
    
    this.baseURL = config.baseURL || process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1';
    this.apiKey = config.apiKey || process.env.QWEN_API_KEY;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY is required for QwenProvider');
    }
  }

  async chatCompletion(options = {}) {
    const {
      model = 'qwen-turbo',
      messages,
      temperature = 1,
      top_p = 0.7,
      max_tokens = 16384,
      stream = false
    } = options;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const requestData = {
      model,
      input: {
        messages
      },
      parameters: {
        temperature,
        top_p,
        max_tokens,
        stream
      }
    };
    
    try {
      const response = await this.client.post('/services/aigc/text-generation/generation', requestData);
      
      // 转换千问API响应格式为标准格式
      const qwenResponse = response.data;
      return {
        id: qwenResponse.request_id,
        object: 'chat.completion',
        created: Date.now(),
        model: model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: qwenResponse.output?.text || qwenResponse.output?.choices?.[0]?.message?.content || ''
          },
          finish_reason: qwenResponse.output?.finish_reason || 'stop'
        }],
        usage: qwenResponse.usage || {}
      };
    } catch (error) {
      console.error('Qwen API Error:', error.response?.data || error.message);
      throw new Error(`Qwen API call failed: ${error.response?.data?.message || error.message}`);
    }
  }

  getProviderName() {
    return 'qwen';
  }

  getSupportedModels() {
    return [
      'qwen-turbo',
      'qwen-plus',
      'qwen-max',
      'qwen-max-longcontext',
      'qwen-vl-plus',
      'qwen-vl-max'
    ];
  }

  /**
   * 千问特有的多模态功能
   * @param {Object} options - 聊天选项
   * @param {string} options.model - 多模态模型名称
   * @param {string} options.imageUrl - 图片URL
   * @param {string} options.text - 文本内容
   * @returns {Promise<Object>} 聊天响应
   */
  async chatWithImage(options = {}) {
    const {
      model = 'qwen-vl-plus',
      imageUrl,
      text,
      temperature = 1,
      top_p = 0.7,
      max_tokens = 32768
    } = options;

    const messages = [{
      role: 'user',
      content: [
        {
          image: imageUrl
        },
        {
          text: text
        }
      ]
    }];

    return this.chatCompletion({
      model,
      messages,
      temperature,
      top_p,
      max_tokens
    });
  }
}

module.exports = QwenProvider;