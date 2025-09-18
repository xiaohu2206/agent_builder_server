const llmFactory = require('./LLMFactory');

/**
 * LLM服务类 - 重构版本
 * 使用工厂模式统一管理多个大模型提供者
 * 保持向后兼容性的同时提供新的功能
 */
class LLMService {
  constructor(defaultProvider = 'doubao') {
    this.defaultProvider = defaultProvider;
    this.factory = llmFactory;
    
    // 为了向后兼容，保留原有的豆包配置检查
    if (defaultProvider === 'doubao' && !process.env.ARK_API_KEY) {
      console.warn('ARK_API_KEY environment variable is not set. Doubao provider may not work properly.');
    }
  }

  /**
   * 聊天完成接口 - 兼容原有接口
   * @param {Object} options - 聊天选项
   * @returns {Promise<Object>} 聊天响应
   */
  async chatCompletion(options = {}) {
    const { provider = this.defaultProvider, ...otherOptions } = options;
    
    try {
      return await this.factory.chat(provider, otherOptions);
    } catch (error) {
      // 如果指定的提供者失败，尝试使用默认提供者
      if (provider !== this.defaultProvider) {
        console.warn(`Provider ${provider} failed, falling back to ${this.defaultProvider}`);
        return await this.factory.chat(this.defaultProvider, otherOptions);
      }
      throw error;
    }
  }

  /**
   * 图文混合聊天接口 - 兼容原有接口
   * @param {Object} options - 聊天选项
   * @returns {Promise<Object>} 聊天响应
   */
  async chatWithImage(options = {}) {
    const { provider = this.defaultProvider, ...otherOptions } = options;
    
    try {
      return await this.factory.chatWithImage(provider, otherOptions);
    } catch (error) {
      if (provider !== this.defaultProvider) {
        console.warn(`Provider ${provider} failed, falling back to ${this.defaultProvider}`);
        return await this.factory.chatWithImage(this.defaultProvider, otherOptions);
      }
      throw error;
    }
  }

  /**
   * 简单文本对话接口 - 兼容原有接口
   * @param {string} model - 模型名称
   * @param {string} userMessage - 用户消息
   * @param {string} systemMessage - 系统消息（可选）
   * @param {string} provider - 提供者名称（可选）
   * @returns {Promise<Object>} 聊天响应
   */
  async simpleChat(model, userMessage, systemMessage = null, provider = null) {
    const selectedProvider = provider || this.defaultProvider;
    
    try {
      return await this.factory.simpleChat(selectedProvider, model, userMessage, systemMessage);
    } catch (error) {
      if (selectedProvider !== this.defaultProvider) {
        console.warn(`Provider ${selectedProvider} failed, falling back to ${this.defaultProvider}`);
        return await this.factory.simpleChat(this.defaultProvider, model, userMessage, systemMessage);
      }
      throw error;
    }
  }

  // ========== 新增功能 ==========

  /**
   * 使用指定提供者进行聊天
   * @param {string} providerName - 提供者名称
   * @param {Object} options - 聊天选项
   * @returns {Promise<Object>} 聊天响应
   */
  async chatWithProvider(providerName, options) {
    return await this.factory.chat(providerName, options);
  }

  /**
   * 获取所有可用的提供者
   * @returns {Array<string>} 提供者名称数组
   */
  getAvailableProviders() {
    return this.factory.getAvailableProviders();
  }

  /**
   * 获取提供者信息
   * @param {string} providerName - 提供者名称
   * @returns {Object} 提供者信息
   */
  getProviderInfo(providerName) {
    return this.factory.getProviderInfo(providerName);
  }

  /**
   * 获取所有提供者信息
   * @returns {Array<Object>} 所有提供者信息数组
   */
  getAllProvidersInfo() {
    return this.factory.getAllProvidersInfo();
  }

  /**
   * 根据模型名称自动选择提供者
   * @param {string} modelName - 模型名称
   * @returns {string|null} 提供者名称
   */
  getProviderByModel(modelName) {
    return this.factory.getProviderByModel(modelName);
  }

  /**
   * 智能聊天 - 自动选择最适合的提供者
   * @param {Object} options - 聊天选项
   * @returns {Promise<Object>} 聊天响应
   */
  async smartChat(options = {}) {
    const { model, ...otherOptions } = options;
    
    if (model) {
      const suggestedProvider = this.getProviderByModel(model);
      if (suggestedProvider) {
        try {
          return await this.factory.chat(suggestedProvider, options);
        } catch (error) {
          console.warn(`Suggested provider ${suggestedProvider} failed, using default provider`);
        }
      }
    }
    
    // 如果没有找到合适的提供者或者失败了，使用默认提供者
    return await this.chatCompletion(options);
  }

  /**
   * 设置默认提供者
   * @param {string} providerName - 提供者名称
   */
  setDefaultProvider(providerName) {
    if (!this.factory.isProviderAvailable(providerName)) {
      throw new Error(`Provider ${providerName} is not available`);
    }
    this.defaultProvider = providerName;
  }

  /**
   * 获取当前默认提供者
   * @returns {string} 默认提供者名称
   */
  getDefaultProvider() {
    return this.defaultProvider;
  }

  /**
   * 批量聊天 - 使用不同提供者进行对比
   * @param {Array<Object>} requests - 请求数组，每个请求包含provider和options
   * @returns {Promise<Array<Object>>} 响应数组
   */
  async batchChat(requests) {
    const promises = requests.map(async (request) => {
      const { provider, options } = request;
      try {
        const response = await this.factory.chat(provider, options);
        return { provider, success: true, response };
      } catch (error) {
        return { provider, success: false, error: error.message };
      }
    });

    return await Promise.all(promises);
  }
}

module.exports = LLMService;