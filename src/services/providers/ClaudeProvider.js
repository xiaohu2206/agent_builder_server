const axios = require('axios');
const BaseLLMProvider = require('./BaseLLMProvider');

/**
 * Claude服务提供者
 * 基于Anthropic Claude API
 */
class ClaudeProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super(config);
    
    this.baseURL = config.baseURL || process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com/v1';
    this.apiKey = config.apiKey || process.env.CLAUDE_API_KEY;
    this.version = config.version || process.env.CLAUDE_VERSION || '2023-06-01';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': this.version,
        'Content-Type': 'application/json'
      }
    });
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error('CLAUDE_API_KEY is required for ClaudeProvider');
    }
  }

  async chatCompletion(options = {}) {
    const {
      model = 'claude-3-sonnet-20240229',
      messages,
      temperature = 1,
      top_p = 1,
      max_tokens = 4096,
      stream = false,
      system
    } = options;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    // Claude API 需要将系统消息单独处理
    const filteredMessages = messages.filter(msg => msg.role !== 'system');
    const systemMessage = system || messages.find(msg => msg.role === 'system')?.content;

    const requestData = {
      model,
      messages: filteredMessages,
      max_tokens,
      temperature,
      top_p,
      stream
    };

    if (systemMessage) {
      requestData.system = systemMessage;
    }
    
    try {
      const response = await this.client.post('/messages', requestData);
      
      // 转换Claude API响应格式为标准格式
      const claudeResponse = response.data;
      return {
        id: claudeResponse.id,
        object: 'chat.completion',
        created: Date.now(),
        model: model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: claudeResponse.content?.[0]?.text || ''
          },
          finish_reason: claudeResponse.stop_reason || 'stop'
        }],
        usage: claudeResponse.usage || {}
      };
    } catch (error) {
      console.error('Claude API Error:', error.response?.data || error.message);
      throw new Error(`Claude API call failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  getProviderName() {
    return 'claude';
  }

  getSupportedModels() {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
    ];
  }

  /**
   * Claude特有的图像理解功能
   * @param {Object} options - 聊天选项
   * @param {string} options.model - 支持视觉的模型
   * @param {string} options.imageUrl - 图片URL或base64数据
   * @param {string} options.text - 文本内容
   * @param {string} options.mediaType - 媒体类型 (image/jpeg, image/png, etc.)
   * @returns {Promise<Object>} 聊天响应
   */
  async chatWithImage(options = {}) {
    const {
      model = 'claude-3-sonnet-20240229',
      imageUrl,
      text,
      mediaType = 'image/jpeg',
      temperature = 1,
      max_tokens = 4096
    } = options;

    let imageContent;
    
    // 判断是URL还是base64数据
    if (imageUrl.startsWith('data:')) {
      // base64格式
      const base64Data = imageUrl.split(',')[1];
      imageContent = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data
        }
      };
    } else {
      // URL格式，需要先下载并转换为base64
      try {
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const base64Data = Buffer.from(imageResponse.data).toString('base64');
        imageContent = {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data
          }
        };
      } catch (error) {
        throw new Error(`Failed to fetch image from URL: ${error.message}`);
      }
    }

    const messages = [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: text
        },
        imageContent
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
   * Claude特有的长文本处理功能
   * @param {Object} options - 聊天选项
   * @param {string} options.longText - 长文本内容
   * @param {string} options.instruction - 处理指令
   * @param {string} options.model - 模型名称
   * @returns {Promise<Object>} 聊天响应
   */
  async processLongText(options = {}) {
    const {
      longText,
      instruction,
      model = 'claude-3-sonnet-20240229',
      temperature = 0.7,
      max_tokens = 4096
    } = options;

    const systemMessage = 'You are an expert at analyzing and processing long texts. Provide clear, structured, and comprehensive responses.';
    const userMessage = `${instruction}\n\nText to process:\n${longText}`;

    return this.chatCompletion({
      model,
      messages: [
        { role: 'user', content: userMessage }
      ],
      system: systemMessage,
      temperature,
      max_tokens
    });
  }
}

module.exports = ClaudeProvider;