# Cobean Backend API Endpoints

本文件汇总后端所有接口，提供给前端工程师进行联调与集成。基础路径为 `/api/v1`。

## 认证与通用规范
- 认证方式：
  - JWT：请求头 `Authorization: Bearer <JWT>`
  - SAT（服务账号令牌）：请求头 `Authorization: Bearer sat_...`
- 响应体统一格式（示例）：
  ```json
  {
    "success": true,
    "data": { /* 对象或数组 */ },
    "message": "可选的成功消息",
    "error": "失败时的错误描述（可选）"
  }
  ```
- 所有 Private 接口均要求认证；Public 接口不需要认证。

---

## Authentication（认证）
- POST /auth/register [Public]
  - Body: { email: string, password: string }
  - Response: { success, user, token, message }
- POST /auth/login [Public]
  - Body: { email: string, password: string }
  - Response: { success, user, token, message }
- GET /auth/me [Private]
  - Response: { success, user, message }
- POST /auth/logout [Private]
  - Response: { success, message }

---

## Thoughts（思考）
- GET /thoughts/public [Public]
  - 获取所有公开的思考
- POST /thoughts [Private]
  - 校验: title(1-200), description(1-2000)
  - Body 示例:
    ```json
    {
      "title": "我的目标",
      "description": "准备跑半马",
      "is_public": false,
      "is_collaborative": false,
      "tags": ["运动", "健康"]
    }
    ```
  - Response: { success, data: Thought }
- POST /thoughts/with-conversation [Private]
  - 与上面一致，同时自动创建关联会话并发送初始消息
- GET /thoughts [Private]
  - 获取当前用户的所有思考
- GET /thoughts/:id [Private]
  - 获取指定思考
- GET /thoughts/:id/with-conversation [Private]
  - 获取思考及其关联的会话信息
- GET /thoughts/:id/context [Private]
  - 获取思考聚合上下文（actions、choices、preferences 等）
- PUT /thoughts/:id [Private]
  - 校验: 可选 title(1-200), description(1-2000)
  - Body: { title?, description? }
- PUT /thoughts/:id/start [Private]
  - 将阶段更新为 in_progress
- DELETE /thoughts/:id [Private]

---

## Actions（行动）
- POST /actions/generate [Private]
  - 校验: thought_id(UUID 必填), context(<=1000 可选), preferences(数组可选)
  - Body 示例:
    ```json
    {
      "thought_id": "<uuid>",
      "context": "额外上下文",
      "preferences": ["健康优先"]
    }
    ```
  - Response: { success, data: Action }
- GET /actions/:id [Private]
  - 获取指定行动详情
- GET /actions/thought/:thoughtId [Private]
  - 根据思考ID获取行动列表
- PUT /actions/:id/status [Private]
  - 校验: status in [pending, in_progress, completed, cancelled]
  - Body: { status: string }
- POST /actions/:id/history [Private]
  - 校验: action_id(UUID), status_change(1-100), notes(<=1000 可选)
  - Body: { action_id, status_change, notes? }
- GET /actions/:id/history [Private]

---

## Choices（选择）
- POST /choices [Private]
  - 校验: action_id(UUID), thought_id(UUID), choice_type in [action_selection, preference, rating, custom], selected_option(1-500)
  - Body 示例:
    ```json
    {
      "action_id": "<uuid>",
      "thought_id": "<uuid>",
      "choice_type": "action_selection",
      "selected_option": "接受行动",
      "available_options": ["接受", "拒绝"],
      "context": "补充说明"
    }
    ```
- GET /choices/:id [Private]
- GET /choices/action/:actionId [Private]
- GET /choices/thought/:thoughtId [Private]
- GET /choices/user [Private]
- PUT /choices/:id [Private]
  - 校验: selected_option(1-500 可选), available_options(数组可选), context(<=1000 可选)
- DELETE /choices/:id [Private]

---

## Chats（会话）
所有聊天接口均需认证，并使用 ensureUser 中间件确保用户表存在。

- Thought 类型（conversation_type: 'thought'）
  - GET /chats/with-thought [Private]
  - POST /chats/with-thought [Private]
    - Body: { title?, thought_id? }（若实现支持）
  - GET /chats/with-thought/:chatId [Private]
  - DELETE /chats/with-thought/:chatId [Private]
  - POST /chats/with-thought/:chatId/messages [Private]
    - Body: { content: string, sender?: 'user'|'bean', metadata?: object }
  - GET /chats/with-thought/:chatId/messages [Private]

- Action 类型（conversation_type: 'execution'）
  - GET /chats/with-action [Private]
  - POST /chats/with-action [Private]
  - GET /chats/with-action/:chatId [Private]
  - DELETE /chats/with-action/:chatId [Private]
  - POST /chats/with-action/:chatId/messages [Private]
    - Body: { content: string, sender?: 'user'|'bean', metadata?: object }
  - GET /chats/with-action/:chatId/messages [Private]

- 兼容旧版（Legacy）
  - GET /chats [Private]
  - POST /chats [Private]
  - GET /chats/:chatId [Private]
  - DELETE /chats/:chatId [Private]
  - POST /chats/:chatId/messages [Private]
  - POST /chats/:chatId/messages/with-action [Private]
  - GET /chats/:chatId/messages [Private]

---

## Coze（对话服务）
- POST /coze/conversation [Private]
  - 创建新会话，返回 conversation_id
- GET /coze/conversation [Private]
  - 获取用户当前会话ID
- DELETE /coze/conversation [Private]
  - 清除会话
- POST /coze/chat [Private]
  - Body: { message: string, conversation_id?: string }
- POST /coze/chat/complete [Private]
  - 同步等待回复
- GET /coze/chat/status [Private]
  - Query: { conversation_id: string, chat_id: string }
- GET /coze/chat/messages [Private]
  - Query: { conversation_id: string, chat_id: string }

---

## Beans（豆子）
- 注意：开发环境使用 mockAuth，生产使用 authenticateToken。
- POST /beans [Private]
- GET /beans/:id [Private]
- GET /beans/user/:userId [Private]
- GET /beans/user/:userId/status [Private]
- PUT /beans/:id [Private]
- DELETE /beans/:id [Private]

---

## Workflow（工作流分析）
- GET /workflow/analyze/:thoughtId [Private]
- POST /workflow/trigger [Private]
- POST /workflow/test [Public]

---

## Mock API（开发联调）
基础路径：`/api/v1/mock`

- Thoughts
  - POST /thoughts
  - GET /thoughts
  - GET /thoughts/:id
  - PUT /thoughts/:id
  - DELETE /thoughts/:id
- Actions
  - POST /actions/generate
  - GET /actions
  - GET /actions/:id
  - GET /actions/thought/:thoughtId
  - PUT /actions/:id/status
- Choices
  - POST /choices
  - GET /choices
  - GET /choices/:id
- Utilities
  - POST /clear-data
  - GET /status

---

## 示例
- 生成行动（Actions.generate）
  ```bash
  curl -X POST "http://localhost:3000/api/v1/actions/generate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <token>" \
    -d '{
      "thought_id": "<uuid>",
      "context": "补充上下文",
      "preferences": ["效率优先"]
    }'
  ```
- 根据思考ID获取行动列表（Actions.byThought）
  ```bash
  curl -X GET "http://localhost:3000/api/v1/actions/thought/<thoughtId>" \
    -H "Authorization: Bearer <token>"
  ```
- 向 Thought 会话发送消息（Chats.with-thought.sendMessage）
  ```bash
  curl -X POST "http://localhost:3000/api/v1/chats/with-thought/<chatId>/messages" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <token>" \
    -d '{ "content": "你好", "sender": "user" }'
  ```