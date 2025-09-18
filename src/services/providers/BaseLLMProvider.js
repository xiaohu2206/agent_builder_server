/**
 * 基础LLM提供者抽象类
 * 定义所有LLM提供者的通用接口
 */
class BaseLLMProvider {
  constructor(config = {}) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * 验证配置
   * 子类需要重写此方法来验证特定的配置项
   */
  validateConfig() {
    // throw new Error('validateConfig method must be implemented by subclass');
  }

  /**
   * 聊天完成接口
   * @param {Object} options - 聊天选项
   * @param {string} options.model - 模型名称
   * @param {Array} options.messages - 消息数组
   * @param {number} options.temperature - 温度参数
   * @param {number} options.top_p - top_p参数
   * @param {number} options.max_tokens - 最大token数
   * @param {boolean} options.stream - 是否流式输出
   * @returns {Promise<Object>} 聊天响应
   */
  async chatCompletion(options = {}) {
    throw new Error('chatCompletion method must be implemented by subclass');
  }

  /**
   * 图文混合聊天接口
   * @param {Object} options - 聊天选项
   * @param {string} options.model - 模型名称
   * @param {string} options.imageUrl - 图片URL
   * @param {string} options.text - 文本内容
   * @param {number} options.temperature - 温度参数
   * @param {number} options.top_p - top_p参数
   * @param {number} options.max_tokens - 最大token数
   * @returns {Promise<Object>} 聊天响应
   */
  async chatWithImage(options = {}) {
    const {
      model,
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
      max_tokens
    });
  }

  /**
   * 简单文本对话接口
   * @param {string} model - 模型名称
   * @param {string} userMessage - 用户消息
   * @param {string} systemMessage - 系统消息（可选）
   * @returns {Promise<Object>} 聊天响应
   */
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

  /**
   * 获取提供者名称
   * @returns {string} 提供者名称
   */
  getProviderName() {
    throw new Error('getProviderName method must be implemented by subclass');
  }

  /**
   * 获取支持的模型列表
   * @returns {Array<string>} 支持的模型列表
   */
  getSupportedModels() {
    throw new Error('getSupportedModels method must be implemented by subclass');
  }
}

module.exports = BaseLLMProvider;