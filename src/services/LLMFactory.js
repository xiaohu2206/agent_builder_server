const DoubaoProvider = require('./providers/DoubaoProvider');
const QwenProvider = require('./providers/QwenProvider');
const DeepSeekProvider = require('./providers/DeepSeekProvider');
const OpenAIProvider = require('./providers/OpenAIProvider');
const ClaudeProvider = require('./providers/ClaudeProvider');

/**
 * LLM工厂类
 * 统一管理所有大模型提供者
 */
class LLMFactory {
  constructor() {
    this.providers = new Map();
    this.defaultConfigs = new Map();
    this.initializeProviders();
  }

  /**
   * 初始化所有提供者
   */
  initializeProviders() {
    // 注册所有提供者类
    this.registerProvider('doubao', DoubaoProvider);
    this.registerProvider('qwen', QwenProvider);
    this.registerProvider('deepseek', DeepSeekProvider);
    this.registerProvider('openai', OpenAIProvider);
    this.registerProvider('claude', ClaudeProvider);
  }

  /**
   * 注册提供者
   * @param {string} name - 提供者名称
   * @param {Class} ProviderClass - 提供者类
   */
  registerProvider(name, ProviderClass) {
    this.providers.set(name, ProviderClass);
  }

  /**
   * 设置提供者的默认配置
   * @param {string} providerName - 提供者名称
   * @param {Object} config - 配置对象
   */
  setDefaultConfig(providerName, config) {
    this.defaultConfigs.set(providerName, config);
  }

  /**
   * 创建提供者实例
   * @param {string} providerName - 提供者名称
   * @param {Object} config - 配置对象（可选）
   * @returns {BaseLLMProvider} 提供者实例
   */
  createProvider(providerName, config = {}) {
    const ProviderClass = this.providers.get(providerName.toLowerCase());
    
    if (!ProviderClass) {
      throw new Error(`Unknown provider: ${providerName}. Available providers: ${this.getAvailableProviders().join(', ')}`);
    }

    // 合并默认配置和传入配置
    const defaultConfig = this.defaultConfigs.get(providerName.toLowerCase()) || {};
    const finalConfig = { ...defaultConfig, ...config };

    try {
      return new ProviderClass(finalConfig);
    } catch (error) {
      throw new Error(`Failed to create ${providerName} provider: ${error.message}`);
    }
  }

  /**
   * 获取可用的提供者列表
   * @returns {Array<string>} 提供者名称数组
   */
  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }

  /**
   * 检查提供者是否可用
   * @param {string} providerName - 提供者名称
   * @returns {boolean} 是否可用
   */
  isProviderAvailable(providerName) {
    return this.providers.has(providerName.toLowerCase());
  }

  /**
   * 获取提供者信息
   * @param {string} providerName - 提供者名称
   * @returns {Object} 提供者信息
   */
  getProviderInfo(providerName) {
    if (!this.isProviderAvailable(providerName)) {
      throw new Error(`Provider ${providerName} is not available`);
    }

    try {
      const provider = this.createProvider(providerName);
      return {
        name: provider.getProviderName(),
        supportedModels: provider.getSupportedModels(),
        available: true
      };
    } catch (error) {
      return {
        name: providerName,
        supportedModels: [],
        available: false,
        error: error.message
      };
    }
  }

  /**
   * 获取所有提供者信息
   * @returns {Array<Object>} 所有提供者信息数组
   */
  getAllProvidersInfo() {
    return this.getAvailableProviders().map(providerName => {
      try {
        return this.getProviderInfo(providerName);
      } catch (error) {
        return {
          name: providerName,
          supportedModels: [],
          available: false,
          error: error.message
        };
      }
    });
  }

  /**
   * 根据模型名称自动选择提供者
   * @param {string} modelName - 模型名称
   * @returns {string|null} 提供者名称，如果找不到返回null
   */
  getProviderByModel(modelName) {
    for (const providerName of this.getAvailableProviders()) {
      try {
        const provider = this.createProvider(providerName);
        if (provider.getSupportedModels().includes(modelName)) {
          return providerName;
        }
      } catch (error) {
        // 忽略配置错误，继续检查其他提供者
        continue;
      }
    }
    return null;
  }

  /**
   * 创建统一的聊天接口
   * @param {string} providerName - 提供者名称
   * @param {Object} options - 聊天选项
   * @returns {Promise<Object>} 聊天响应
   */
  async chat(providerName, options) {
    const provider = this.createProvider(providerName);
    return provider.chatCompletion(options);
  }

  /**
   * 创建统一的图文聊天接口
   * @param {string} providerName - 提供者名称
   * @param {Object} options - 聊天选项
   * @returns {Promise<Object>} 聊天响应
   */
  async chatWithImage(providerName, options) {
    const provider = this.createProvider(providerName);
    return provider.chatWithImage(options);
  }

  /**
   * 简单文本对话接口
   * @param {string} providerName - 提供者名称
   * @param {string} model - 模型名称
   * @param {Array} messages - 消息数组，包含role和content字段
   * @param {Object} options - 额外的聊天选项（可选）
   * @returns {Promise<Object>} 聊天响应
   */
  async simpleChat(providerName, model, messages, options = {}) {
    const provider = this.createProvider(providerName);
    return provider.simpleChat(model, messages, options);
  }
}

// 创建单例实例
const llmFactory = new LLMFactory();

module.exports = llmFactory;