# Cobean Backend 快速部署指南

**服务器 IP**: `47.116.161.64`

## 🚀 一键部署命令

### 1. 连接服务器
```bash
ssh root@47.116.161.64
```

### 2. 安装基础环境
```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 安装 PM2
npm install -g pm2

# 安装 Nginx
apt install -y nginx

# 启动并设置开机自启
systemctl start nginx
systemctl enable nginx
```

### 3. 部署项目
```bash
# 创建项目目录
mkdir -p /var/www
cd /var/www

# 克隆项目 (替换为你的仓库地址)
git clone https://github.com/your-username/cobean-backend.git
cd cobean-backend

# 安装依赖并构建
npm install  # 安装所有依赖（包括 TypeScript）
npm run build  # 构建项目

# 配置环境变量
cp .env.example .env
nano .env  # 编辑环境变量

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. 配置 Nginx
```bash
# 复制 Nginx 配置
cp nginx.conf /etc/nginx/sites-available/cobean-backend

# 启用站点
ln -s /etc/nginx/sites-available/cobean-backend /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

## 🔧 环境变量配置

编辑 `.env` 文件：
```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
COZE_API_TOKEN=your_coze_api_token
COZE_BOT_ID=your_coze_bot_id
CORS_ORIGIN=http://47.116.161.64
SAT_TOKEN_ENABLED=false
```

## 📊 验证部署

### 检查应用状态
```bash
pm2 status
pm2 logs cobean-backend
```

### 测试 API
```bash
# 测试健康检查
curl http://47.116.161.64/health

# 测试 API 端点
curl http://47.116.161.64/api/thoughts
```

## 🔄 后续更新

使用自动化部署脚本：
```bash
cd /var/www/cobean-backend
./deploy.sh
```

## 🛠️ 常用管理命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs cobean-backend

# 重启应用
pm2 restart cobean-backend

# 监控应用
pm2 monit

# 查看 Nginx 状态
systemctl status nginx

# 重启 Nginx
systemctl restart nginx
```

## 🔒 安全建议

1. **防火墙配置**：
```bash
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable
```

2. **定期更新**：
```bash
apt update && apt upgrade -y
npm update
```

3. **备份数据**：定期备份 Supabase 数据库

## 📞 访问地址

- **API 基础地址**: `http://47.116.161.64`
- **健康检查**: `http://47.116.161.64/health`
- **API 文档**: 参考 `api-endpoints.md`

---

**注意**: 如果有域名，建议配置 SSL 证书以启用 HTTPS。