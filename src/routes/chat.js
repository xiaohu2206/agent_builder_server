const express = require('express');
const router = express.Router();
const LLMService = require('../services/llmService');
const Conversation = require('../models/Conversation');

// 初始化LLM服务
let llmService;
try {
  llmService = new LLMService();
} catch (error) {
  console.error('Failed to initialize LLM service:', error.message);
}

// 简单文本聊天
router.post('/simple', async (req, res) => {
  try {
    if (!llmService) {
      return res.status(500).json({ error: 'LLM service not available' });
    }

    const { model, message, systemMessage } = req.body;

    if (!model || !message) {
      return res.status(400).json({ error: 'Model and message are required' });
    }

    const response = await llmService.simpleChat(model, message, systemMessage);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request',
      details: error.message 
    });
  }
});

// 图片和文本混合聊天
router.post('/image', async (req, res) => {
  try {
    if (!llmService) {
      return res.status(500).json({ error: 'LLM service not available' });
    }

    const { model, imageUrl, text, temperature, top_p, max_tokens } = req.body;

    if (!model || !imageUrl || !text) {
      return res.status(400).json({ error: 'Model, imageUrl and text are required' });
    }

    const response = await llmService.chatWithImage({
      model,
      imageUrl,
      text,
      temperature,
      top_p,
      max_tokens
    });
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Image chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process image chat request',
      details: error.message 
    });
  }
});

// 完整聊天对话
router.post('/completions', async (req, res) => {
  try {
    if (!llmService) {
      return res.status(500).json({ error: 'LLM service not available' });
    }

    const {
      model,
      messages,
      temperature,
      top_p,
      max_tokens,
      thinking,
      stream,
      encrypted,
      userId,
      saveConversation = false
    } = req.body;

    if (!model || !messages) {
      return res.status(400).json({ error: 'Model and messages are required' });
    }

    const response = await llmService.chatCompletion({
      model,
      messages,
      temperature,
      top_p,
      max_tokens,
      thinking,
      stream,
      encrypted
    });

    // 如果需要保存对话记录
    if (saveConversation && userId) {
      try {
        const conversation = new Conversation({
          userId,
          messages: [...messages, {
            role: 'assistant',
            content: response.choices[0].message.content,
            timestamp: new Date()
          }],
          model
        });
        await conversation.save();
      } catch (saveError) {
        console.error('Failed to save conversation:', saveError);
      }
    }
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Chat completions error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat completions request',
      details: error.message 
    });
  }
});

// 获取对话历史
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const conversations = await Conversation.find({ userId, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-messages')
      .exec();

    const total = await Conversation.countDocuments({ userId, isActive: true });

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ 
      error: 'Failed to get conversations',
      details: error.message 
    });
  }
});

// 获取特定对话详情
router.get('/conversation/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ 
      error: 'Failed to get conversation',
      details: error.message 
    });
  }
});

module.exports = router;