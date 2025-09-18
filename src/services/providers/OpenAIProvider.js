const axios = require('axios');
const BaseLLMProvider = require('./BaseLLMProvider');

/**
 * OpenAI ChatGPT服务提供者
 * 基于OpenAI API
 */
class OpenAIProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super(config);
    
    this.baseURL = config.baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.organization = config.organization || process.env.OPENAI_ORGANIZATION;
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers
    });
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAIProvider');
    }
  }

  async chatCompletion(options = {}) {
    const {
      model = 'gpt-3.5-turbo',
      messages,
      temperature = 1,
      top_p = 1,
      max_tokens,
      stream = false,
      presence_penalty = 0,
      frequency_penalty = 0,
      logit_bias,
      user
    } = options;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const requestData = {
      model,
      messages,
      temperature,
      top_p,
      stream,
      presence_penalty,
      frequency_penalty
    };

    // 只有在指定时才添加这些可选参数
    if (max_tokens) requestData.max_tokens = max_tokens;
    if (logit_bias) requestData.logit_bias = logit_bias;
    if (user) requestData.user = user;
    
    try {
      const response = await this.client.post('/chat/completions', requestData);
      return response.data;
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      throw new Error(`OpenAI API call failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  getProviderName() {
    return 'openai';
  }

  getSupportedModels() {
    return [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-4-vision-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'gpt-4o',
      'gpt-4o-mini'
    ];
  }

  /**
   * OpenAI特有的图像理解功能
   * @param {Object} options - 聊天选项
   * @param {string} options.model - 支持视觉的模型
   * @param {string} options.imageUrl - 图片URL
   * @param {string} options.text - 文本内容
   * @param {string} options.detail - 图像细节级别 ('low', 'high', 'auto')
   * @returns {Promise<Object>} 聊天响应
   */
  async chatWithImage(options = {}) {
    const {
      model = 'gpt-4-vision-preview',
      imageUrl,
      text,
      detail = 'auto',
      temperature = 1,
      max_tokens = 4096
    } = options;

    const messages = [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: text
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl,
            detail: detail
          }
        }
      ]
    }];

    return this.chatCompletion({
      model,
      messages,
      temperature,
      max_tokens
    });
  }

  /**
   * OpenAI特有的函数调用功能
   * @param {Object} options - 聊天选项
   * @param {Array} options.functions - 函数定义数组
   * @param {string} options.function_call - 函数调用控制
   * @returns {Promise<Object>} 聊天响应
   */
  async chatWithFunctions(options = {}) {
    const {
      model = 'gpt-3.5-turbo',
      messages,
      functions,
      function_call = 'auto',
      temperature = 1,
      max_tokens
    } = options;

    const requestData = {
      model,
      messages,
      functions,
      function_call,
      temperature
    };

    if (max_tokens) requestData.max_tokens = max_tokens;

    try {
      const response = await this.client.post('/chat/completions', requestData);
      return response.data;
    } catch (error) {
      console.error('OpenAI Functions API Error:', error.response?.data || error.message);
      throw new Error(`OpenAI Functions API call failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 获取模型列表
   * @returns {Promise<Array>} 可用模型列表
   */
  async getModels() {
    try {
      const response = await this.client.get('/models');
      return response.data.data;
    } catch (error) {
      console.error('OpenAI Models API Error:', error.response?.data || error.message);
      throw new Error(`Failed to get models: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = OpenAIProvider;