# Cobean Backend API

Backend API for the Cobean iOS app built with Node.js, TypeScript, Express, and Supabase.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd cobean-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your actual values:
   ```env
   PORT=3000
   NODE_ENV=development
   
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 📱 iOS开发者接口说明

### 基础信息

- **Base URL**: `http://localhost:3000/api/v1`
- **Content-Type**: `application/json`
- **认证方式**: JWT Bearer Token

### 🔐 用户认证接口

#### 1. 用户注册

**接口地址**: `POST /auth/register`

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "user": {
    "id": "49316733-4f02-44c3-90ee-b70506b300a5",
    "email": "user@example.com",
    "created_at": "2025-09-25T07:48:18.764082Z",
    "updated_at": "2025-09-25T07:48:20.88474Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "User registered successfully"
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "Email already exists"
}
```

#### 2. 用户登录

**接口地址**: `POST /auth/login`

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "user": {
    "id": "49316733-4f02-44c3-90ee-b70506b300a5",
    "email": "user@example.com",
    "created_at": "2025-09-25T07:48:18.764082Z",
    "updated_at": "2025-09-25T07:48:20.88474Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

**错误响应**:
- **邮箱未确认** (400):
```json
{
  "success": false,
  "error": "Email not confirmed"
}
```

- **登录失败** (401):
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

#### 3. 获取当前用户信息

**接口地址**: `GET /auth/me`

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**成功响应** (200):
```json
{
  "success": true,
  "user": {
    "id": "49316733-4f02-44c3-90ee-b70506b300a5",
    "email": "user@example.com",
    "created_at": "2025-09-25T07:48:18.764082Z",
    "updated_at": "2025-09-25T07:48:20.88474Z"
  },
  "message": "User information retrieved successfully"
}
```

**错误响应** (401):
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

#### 4. 用户登出

**接口地址**: `POST /auth/logout`

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 📝 iOS开发集成指南

#### Swift网络请求示例

```swift
import Foundation

class AuthService {
    private let baseURL = "http://localhost:3000/api/v1"
    
    // 用户注册
    func register(email: String, password: String, completion: @escaping (Result<AuthResponse, Error>) -> Void) {
        let url = URL(string: "\(baseURL)/auth/register")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": email, "password": password]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            // 处理响应
        }.resume()
    }
    
    // 用户登录
    func login(email: String, password: String, completion: @escaping (Result<AuthResponse, Error>) -> Void) {
        let url = URL(string: "\(baseURL)/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": email, "password": password]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            // 处理响应
        }.resume()
    }
    
    // 获取用户信息
    func getCurrentUser(token: String, completion: @escaping (Result<UserResponse, Error>) -> Void) {
        let url = URL(string: "\(baseURL)/auth/me")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            // 处理响应
        }.resume()
    }
}

// 数据模型
struct AuthResponse: Codable {
    let success: Bool
    let user: User?
    let token: String?
    let message: String?
    let error: String?
}

struct UserResponse: Codable {
    let success: Bool
    let user: User?
    let message: String?
    let error: String?
}

struct User: Codable {
    let id: String
    let email: String
    let created_at: String
    let updated_at: String
}
```

### 🔒 Token管理建议

1. **存储Token**: 使用Keychain存储JWT token，确保安全性
2. **Token刷新**: 当前token有效期为7天，建议在登录成功后保存token
3. **自动登录**: 应用启动时检查本地token，调用`/auth/me`验证有效性
4. **登出处理**: 登出时清除本地存储的token

### 🚨 错误处理

所有接口都遵循统一的错误响应格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

常见HTTP状态码：
- `200`: 请求成功
- `400`: 请求参数错误
- `401`: 未授权（token无效或过期）
- `404`: 资源不存在
- `500`: 服务器内部错误

### 🧪 测试接口

可以使用以下curl命令测试接口：

```bash
# 注册用户
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 用户登录
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 获取用户信息
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 📋 开发注意事项

1. **网络环境**: 开发时确保iOS设备/模拟器能访问后端服务器
2. **HTTPS**: 生产环境建议使用HTTPS
3. **错误处理**: 建议对所有网络请求添加适当的错误处理和用户提示
4. **Loading状态**: 网络请求期间显示加载状态，提升用户体验
5. **输入验证**: 客户端也应进行基础的邮箱格式和密码强度验证

### 📚 更多API

完整的API文档请参考 `backend.md` 文件，包含想法管理、行动计划等其他功能接口。

## 🛠 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm run test` - Run tests

### Project Structure

```
src/
├── controllers/     # Request handlers
├── routes/         # API routes
├── middleware/     # Custom middleware
├── models/         # Data models
├── types/          # TypeScript type definitions
└── config/         # Configuration files
```

## 📄 License

This project is licensed under the MIT License.