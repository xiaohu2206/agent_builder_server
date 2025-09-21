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

    const { model, messages, systemMessage, stream } = req.body;
    if (!model || !messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Model and messages array are required' });
    }

    if (stream) {
      // 流式响应处理
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      try {
        await llmService.simpleChat(model, messages, null, {
          stream: true,
          onData: (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
          },
          onEnd: () => {
            res.write('data: [DONE]\n\n');
            res.end();
          },
          onError: (error) => {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
          }
        });
      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    } else {
      // 非流式响应处理
      const response = await llmService.simpleChat(model, messages, null, {
        stream: false
      });
      
      res.json({
        success: true,
        data: response
      });
    }
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