const axios = require('axios');
const BaseLLMProvider = require('./BaseLLMProvider');

/**
 * DeepSeek大模型服务提供者
 * 基于DeepSeek API
 */
class DeepSeekProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super(config);
    
    this.baseURL = config.baseURL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    this.apiKey = config.apiKey || process.env.DEEPSEEK_API_KEY;
    
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
      throw new Error('DEEPSEEK_API_KEY is required for DeepSeekProvider');
    }
  }

  async chatCompletion(options = {}) {
    const {
      model = 'deepseek-chat',
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
      messages,
      temperature,
      top_p,
      max_tokens,
      stream
    };
    
    try {
      const response = await this.client.post('/chat/completions', requestData);
      return response.data;
    } catch (error) {
      console.error('DeepSeek API Error:', error.response?.data || error.message);
      throw new Error(`DeepSeek API call failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  getProviderName() {
    return 'deepseek';
  }

  getSupportedModels() {
    return [
      'deepseek-chat',
      'deepseek-coder',
      'deepseek-reasoner'
    ];
  }

  /**
   * DeepSeek特有的代码生成功能
   * @param {Object} options - 聊天选项
   * @param {string} options.codePrompt - 代码生成提示
   * @param {string} options.language - 编程语言
   * @returns {Promise<Object>} 聊天响应
   */
  async generateCode(options = {}) {
    const {
      codePrompt,
      language = 'javascript',
      model = 'deepseek-coder',
      temperature = 0.1,
      max_tokens = 4096
    } = options;

    const systemMessage = `You are an expert ${language} programmer. Generate clean, efficient, and well-documented code.`;
    
    return this.simpleChat(model, codePrompt, systemMessage);
  }

  /**
   * DeepSeek特有的推理功能
   * @param {Object} options - 推理选项
   * @param {string} options.problem - 问题描述
   * @param {string} options.model - 推理模型
   * @returns {Promise<Object>} 聊天响应
   */
  async reasoning(options = {}) {
    const {
      problem,
      model = 'deepseek-reasoner',
      temperature = 0.7,
      max_tokens = 8192
    } = options;

    const systemMessage = 'You are a logical reasoning expert. Think step by step and provide detailed reasoning for your conclusions.';
    
    return this.chatCompletion({
      model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: problem }
      ],
      temperature,
      max_tokens
    });
  }
}

module.exports = DeepSeekProvider;