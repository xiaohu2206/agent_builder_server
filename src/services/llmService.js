const axios = require('axios');

class LLMService {
  constructor() {
    this.baseURL = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    this.apiKey = process.env.ARK_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('ARK_API_KEY environment variable is required');
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async chatCompletion(options = {}) {
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
        headers
      });
      
      return response.data;
    } catch (error) {
      console.error('LLM API Error:', error.response?.data || error.message);
      throw new Error(`LLM API call failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // 处理图片和文本混合消息
  async chatWithImage(options = {}) {
    const {
      model,
      imageUrl,
      text,
      temperature = 1,
      top_p = 0.7,
      max_tokens = 32768,
      encrypted = true
    } = options;

    const messages = [{
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: imageUrl
          }
        },
        {
          type: 'text',
          text: text
        }
      ]
    }];

    return this.chatCompletion({
      model,
      messages,
      temperature,
      top_p,
      max_tokens,
      encrypted
    });
  }

  // 简单文本对话
  async simpleChat(model, userMessage, systemMessage = null) {
    const messages = [];
    
    if (systemMessage) {
      messages.push({
        role: 'system',
        content: systemMessage
      });
    }
    
    messages.push({
      role: 'user',
      content: userMessage
    });

    return this.chatCompletion({
      model,
      messages
    });
  }
}

module.exports = LLMService;