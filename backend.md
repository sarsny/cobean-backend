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

- 数据保留策略：每个 thought_id 仅保留最近的一个 conversation。旧会话及其消息会按需清理，以降低数据冗余并保证上下文一致性。
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

重要：自 2025-09-30 起，完整且最新的接口文档已迁移至项目根目录的 api-endpoints.md。此处仅保留历史摘要，最新请求/响应示例与认证说明请查看独立文档。

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

### 本地开发环境

#### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account and project

#### Environment Variables
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

#### Installation & Running
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

### 生产环境部署

详细的阿里云服务器部署指南请参考：[deployment-guide.md](./deployment-guide.md)

**快速部署步骤：**
1. 准备阿里云 ECS 实例
2. 安装 Node.js 和 PM2
3. 上传项目代码
4. 配置环境变量
5. 使用提供的部署脚本：`./deploy.sh`

### 代码更新

服务器代码更新指南请参考：[update-guide.md](./update-guide.md)

**快速更新步骤：**
```bash
ssh root@47.116.161.64
cd /var/www/cobean-backend
./deploy.sh
```

**部署文件：**
- `deployment-guide.md` - 完整部署指南
- `update-guide.md` - 代码更新指南
- `quick-deploy.md` - 快速部署指南
- `ecosystem.config.js` - PM2 配置文件
- `deploy.sh` - 自动化部署脚本
- `nginx.conf` - Nginx 配置模板
- `troubleshooting.md` - 故障排查指南

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

### 2025-10-08
- **Node.js 版本要求更新**: 将最低版本要求从 18.0.0 升级到 20.0.0
- **修复 ES Module 兼容性**: 解决 uuid 包的 ERR_REQUIRE_ESM 错误
- **更新部署文档**: 添加 Node.js 版本检查和升级指南
- **增强修复脚本**: server-fix-commands.sh 现在包含 Node.js 版本检查

### 2025-09-30
- **新增服务器代码更新指南**: 创建 `update-guide.md` 文件，提供详细的服务器代码更新流程
- **更新部署支持文件**: 完善 `deployment-guide.md`、`quick-deploy.md`、`troubleshooting.md` 等相关文档
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