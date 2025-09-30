# Cobean iOS App Backend Documentation

## Overview

Cobean is an iOS application backend that provides intelligent assistance through AI-powered conversations. The backend is built with Node.js, Express, TypeScript, and Supabase as the database.

### Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI Service**: Coze API
- **Authentication**: JWT + SAT (Service Account Token)

## Database Schema

### Tables

#### users
- `id` (text, primary key)
- `username` (text, unique)
- `email` (text, unique, nullable)
- `created_at` (timestamptz)

#### thoughts
- `id` (uuid, primary key)
- `user_id` (text, not null)
- `title` (text, not null)
- `description` (text, not null)
- `created_at` (timestamptz)
- `is_public` (boolean, default: false)
- `is_collaborative` (boolean, default: false)
- `tags` (text[], default: '{}')
- `bean_id` (uuid, nullable, foreign key to beans.id)
- `stage` (text, default: 'created')

#### beans
- `id` (uuid, primary key)
- `user_id` (text, not null)
- `name` (text, not null)
- `persona` (jsonb, nullable)
- `status` (text, default: 'active')
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

#### conversations
- `id` (uuid, primary key)
- `thought_id` (uuid, foreign key to thoughts.id)
- `bean_id` (uuid, foreign key to beans.id)
- `user_id` (text, not null)
- `external_conversation_id` (text, nullable)
- `agent_type` (text, default: 'coze')
- `status` (text, default: 'active')
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `coze_conversation_id` (text, nullable)
- `conversation_type` (text, default: 'thought')

#### messages
- `id` (uuid, primary key)
- `conversation_id` (uuid, foreign key to conversations.id)
- `sender` (text, check: 'user', 'bean', 'agent')
- `content` (text, not null)
- `metadata` (jsonb, nullable)
- `created_at` (timestamptz)
- `type` (text, default: 'mardown')

#### actions
- `id` (uuid, primary key)
- `thought_id` (uuid, foreign key to thoughts.id)
- `bean_id` (uuid, foreign key to beans.id)
- `type` (text, nullable)
- `summary` (text, not null)
- `event` (text, nullable)
- `knowledge` (text, nullable)
- `decision` (text, nullable)
- `reflection` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

#### goals
- `id` (uuid, primary key)
- `user_id` (text, not null)
- `thought_id` (uuid, foreign key to thoughts.id)
- `title` (text, not null)
- `description` (text, nullable)
- `status` (text, default: 'ongoing')
- `start_date` (date, default: CURRENT_DATE)
- `end_date` (date, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

#### diaries
- `id` (uuid, primary key)
- `user_id` (text, not null)
- `goal_id` (uuid, foreign key to goals.id, nullable)
- `content` (text, not null)
- `mood` (text, nullable)
- `created_at` (timestamptz)

#### progress
- `id` (uuid, primary key)
- `goal_id` (uuid, foreign key to goals.id)
- `date` (date, default: CURRENT_DATE)
- `progress_value` (integer, check: 0-100, nullable)
- `note` (text, nullable)
- `created_at` (timestamptz)

#### user_choices
- `id` (uuid, primary key)
- `user_id` (uuid, not null)
- `action_id` (uuid, not null)
- `choice_type` (text, check: 'accept', 'reject', 'modify', 'propose_new', 'discuss_only')
- `choice_content` (jsonb, nullable)
- `created_at` (timestamptz)

#### action_history
- `id` (uuid, primary key)
- `action_id` (uuid, not null)
- `user_id` (uuid, not null)
- `final_status` (text, check: 'planned', 'done', 'skipped', 'rejected')
- `notes` (text, nullable)
- `updated_at` (timestamptz)

#### user_preferences
- `id` (uuid, primary key)
- `user_id` (text, not null)
- `preference_key` (text, not null)
- `score` (integer, check: 1-10)
- `updated_at` (timestamptz)

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Thoughts
- `GET /api/v1/thoughts` - Get user's thoughts
- `GET /api/v1/thoughts/:id` - Get specific thought
- `POST /api/v1/thoughts` - Create new thought
- `POST /api/v1/thoughts/with-conversation` - **NEW** Create thought with automatic conversation and initial message
- `PUT /api/v1/thoughts/:id` - Update thought
- `DELETE /api/v1/thoughts/:id` - Delete thought
- `GET /api/v1/thoughts/public` - Get public thoughts
- `GET /api/v1/thoughts/:id/context` - Get thought with conversation context
- `PUT /api/v1/thoughts/:id/stage/in-progress` - Update thought stage to in-progress

### Conversations & Messages
- `GET /api/v1/chats/:conversationId/messages` - Get conversation messages
- `POST /api/v1/chats/:conversationId/messages` - Send message to conversation

### Actions
- `POST /api/v1/actions/generate` - Generate action for thought
- `GET /api/v1/actions/:thoughtId` - Get actions for thought

### Beans
- `GET /api/v1/beans` - Get user's beans
- `POST /api/v1/beans` - Create new bean
- `PUT /api/v1/beans/:id` - Update bean

### Coze Integration
- `POST /api/v1/coze/chat` - Direct chat with Coze service

## Project Structure

```
src/
├── app.ts                 # Express app configuration
├── index.ts              # Server entry point
├── config/
│   ├── database.ts       # Supabase configuration
│   └── index.ts          # Config exports
├── controllers/
│   ├── authController.ts # Authentication logic
│   ├── thoughtController.ts # Thought management
│   ├── chatController.ts # Chat/conversation logic
│   ├── cozeController.ts # Coze service integration
│   └── beanController.ts # Bean management
├── middleware/
│   ├── auth.ts          # JWT/SAT authentication
│   ├── ensureUser.ts    # User creation middleware
│   ├── errorHandler.ts  # Global error handling
│   └── validation.ts    # Request validation
├── models/
│   ├── Thought.ts       # Thought data model
│   ├── Chat.ts          # Conversation data model
│   ├── ChatMessage.ts   # Message data model
│   ├── Bean.ts          # Bean data model
│   └── Action.ts        # Action data model
├── routes/
│   ├── index.ts         # Main router
│   ├── thoughtRoutes.ts # Thought endpoints
│   ├── chatRoutes.ts    # Chat endpoints
│   ├── authRoutes.ts    # Auth endpoints
│   └── cozeRoutes.ts    # Coze endpoints
├── services/
│   ├── cozeService.ts   # Coze API integration
│   └── cobeanService.ts # Internal services
└── types/
    └── index.ts         # TypeScript type definitions
```

## Setup & Deployment Guide

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account and project

### Environment Variables
Create `.env` file with:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
COZE_API_TOKEN=your_coze_api_token
COZE_BOT_ID=your_coze_bot_id
PORT=3000
```

### Installation & Running
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Authentication

#### JWT Authentication
Standard JWT tokens for user authentication.

#### SAT (Service Account Token) Authentication
Special tokens for service-to-service communication:
- Format: `sat_` + base64 encoded data
- Allows bypassing normal user authentication
- Creates pseudo-users for testing/automation
- Whitelist controlled in `auth.ts`

Valid SAT Token: `sat_X1n9dwCN24G3FKkKBwbEqEpL6pAOOCWbx24lOrRxeAdFvBtZEC7DY5qs7DNBlXyL`

## 测试状态

### 完整聊天流程测试 (2025-01-29)
✅ **测试通过** - 所有核心功能正常工作

**测试覆盖范围:**
1. 用户注册和认证 ✅
2. Thought 创建 ✅
3. 聊天会话创建 ✅
4. 消息发送和 AI 回复 ✅

**已知问题:**
- Bean 创建接口需要进一步优化（当前使用现有 Bean ID 作为备选方案）

**测试脚本:** `test-complete-flow.js`

## Changelog

### 2025-01-29
- **修复 Thought 创建问题**: 解决了测试脚本中包含数据库不存在字段（category、content）导致的创建失败问题
- **修复 UUID 格式错误**: 将无效的默认 Bean ID 替换为有效的 UUID 格式
- **修复 AI 回复显示问题**: 修正了测试脚本中访问 AI 回复内容的数据结构路径
- **完善错误处理**: 在 thoughtController 和 chatController 中增加了详细的错误日志记录
- **测试流程验证**: 完整的聊天流程测试通过，包括用户注册、Thought 创建、聊天会话创建和消息发送
- **优化聊天项处理逻辑**: 改进了 `cobeanService.ts` 中工作流分析结果的消息存储机制
  - 根据聊天项是否包含 `action` 字段或 `message` 字段自动区分消息类型
  - `action` 类型消息：存储行动建议，metadata 包含 `message_type: 'action'` 和 `action_data`
  - `text` 类型消息：存储 Coben 的语音内容，metadata 包含 `message_type: 'text'` 和 `message_data`
  - 所有消息都保留完整的 `original_data` 用于调试和追溯
- **验证消息类型存储**: 通过数据库查询确认不同类型的聊天项能正确区分和存储

### 2025-09-29
- **Added**: New endpoint `POST /api/v1/thoughts/with-conversation`
  - Creates a thought and automatically sets up a conversation
  - Sends initial message to Coze service
  - Handles Coze response and stores it in the conversation
  - Provides seamless integration between thought creation and AI interaction
- **Updated**: `thoughtController.ts` with `createThoughtWithConversation` method
- **Updated**: `thoughtRoutes.ts` to include new endpoint
- **Fixed**: Bean ID validation to use proper UUID format
- **Tested**: Complete flow from thought creation to AI response

### 2025-09-28
- **Added**: Coze service integration for AI conversations
- **Added**: Conversation and message management system
- **Added**: Bean (AI assistant) management
- **Updated**: Database schema with conversations and messages tables
- **Added**: SAT token authentication system

### 2025-09-27
- **Initial**: Project setup with basic thought and action management
- **Added**: User authentication with JWT
- **Added**: Basic CRUD operations for thoughts and actions
- **Added**: Supabase database integration