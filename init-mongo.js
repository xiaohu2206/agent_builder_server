// MongoDB initialization script
// This script will be executed when the MongoDB container starts for the first time

// Switch to the agent_builder database
db = db.getSiblingDB('agent_builder');

// Create a user for the application
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'agent_builder'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30,
          description: 'Username must be a string between 3-30 characters'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Password must be at least 6 characters'
        },
        apiKey: {
          bsonType: ['string', 'null'],
          description: 'API key for the user'
        },
        isActive: {
          bsonType: 'bool',
          description: 'Whether the user is active'
        }
      }
    }
  }
});

db.createCollection('conversations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'model'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'Reference to user ID'
        },
        title: {
          bsonType: 'string',
          description: 'Conversation title'
        },
        messages: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['role', 'content'],
            properties: {
              role: {
                bsonType: 'string',
                enum: ['user', 'assistant', 'system'],
                description: 'Message role'
              },
              content: {
                description: 'Message content'
              },
              timestamp: {
                bsonType: 'date',
                description: 'Message timestamp'
              }
            }
          }
        },
        model: {
          bsonType: 'string',
          description: 'AI model used for conversation'
        },
        isActive: {
          bsonType: 'bool',
          description: 'Whether the conversation is active'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.conversations.createIndex({ userId: 1 });
db.conversations.createIndex({ createdAt: -1 });

print('Database initialization completed successfully!');