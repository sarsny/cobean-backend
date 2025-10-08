# Cobean Backend 阿里云服务器部署指南

## 服务器环境准备

### 1. 服务器信息

**服务器 IP**: `47.116.161.64`

### 2. 购买阿里云 ECS 实例
- **推荐配置**: 2核4GB内存，40GB系统盘
- **操作系统**: Ubuntu 20.04 LTS 或 CentOS 8
- **网络**: 确保开放 80、443、3000 端口

### 3. 连接服务器
```bash
# 使用 SSH 连接服务器
ssh root@47.116.161.64
```

### 3. 安装基础环境

#### 安装 Node.js (推荐使用 nvm)
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装 Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# 验证安装
node --version
npm --version
```

#### 安装 PM2 (进程管理器)
```bash
npm install -g pm2
```

#### 安装 Nginx (可选，用于反向代理)
```bash
# Ubuntu
sudo apt update
sudo apt install nginx

# CentOS
sudo yum update
sudo yum install nginx
```

## 项目部署

### 1. 上传项目代码

#### 方式一：使用 Git (推荐)
```bash
# 在服务器上克隆项目
cd /var/www
git clone https://github.com/your-username/cobean-backend.git
cd cobean-backend
```

#### 方式二：使用 SCP 上传
```bash
# 在本地执行，上传项目文件
scp -r ./cobean-backend root@47.116.161.64:/var/www/
```

### 3.2 安装项目依赖

```bash
cd /var/www/cobean-backend

# 首先安装所有依赖（包括开发依赖，用于构建）
npm install

# 构建项目
npm run build

# 构建完成后，重新安装仅生产依赖（可选，节省空间）
# npm ci --production
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**生产环境 .env 配置示例：**
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# JWT Configuration
JWT_SECRET=your_strong_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# SAT Token Configuration
SAT_ENABLED=true

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Coze API Configuration
COZE_API_TOKEN=your_coze_api_token
COZE_BOT_ID=your_coze_bot_id
```

### 3.4 构建项目

**注意**: 构建步骤已在 3.2 节中完成，这里不需要重复执行。

如果需要单独构建：
```bash
# 确保已安装所有依赖（包括 TypeScript）
npm install

# 构建项目
npm run build

# 验证构建结果
ls -la dist/
```

### 5. 使用 PM2 启动应用
```bash
# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'cobean-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

## Nginx 反向代理配置 (可选但推荐)

### 1. 创建 Nginx 配置
```bash
sudo nano /etc/nginx/sites-available/cobean-backend
```

### 2. 配置内容
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或服务器IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/cobean-backend /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## SSL 证书配置 (HTTPS)

### 使用 Let's Encrypt 免费证书
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 防火墙配置

### Ubuntu (ufw)
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### CentOS (firewalld)
```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 监控和维护

### PM2 常用命令
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs cobean-backend

# 重启应用
pm2 restart cobean-backend

# 停止应用
pm2 stop cobean-backend

# 监控应用
pm2 monit
```

### 系统监控
```bash
# 查看系统资源使用情况
htop

# 查看磁盘使用情况
df -h

# 查看内存使用情况
free -h
```

## 数据库备份 (Supabase)

由于使用 Supabase 作为数据库，数据备份由 Supabase 自动处理。建议：

1. 定期导出重要数据
2. 设置 Supabase 项目的备份策略
3. 监控 Supabase 项目状态

## 部署脚本自动化

### 创建部署脚本
```bash
cat > deploy.sh << 'EOF'
#!/bin/bash

echo "开始部署 Cobean Backend..."

# 拉取最新代码
git pull origin main

# 安装依赖
npm install --production

# 构建项目
npm run build

# 重启 PM2 应用
pm2 restart cobean-backend

echo "部署完成！"
EOF

chmod +x deploy.sh
```

### 使用部署脚本
```bash
./deploy.sh
```

## 故障排查

### 常见问题

1. **端口被占用**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 PID
   ```

2. **权限问题**
   ```bash
   sudo chown -R $USER:$USER /opt/cobean-backend
   ```

3. **环境变量未生效**
   ```bash
   # 检查环境变量
   pm2 show cobean-backend
   ```

4. **Nginx 配置错误**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

### 日志查看
```bash
# PM2 日志
pm2 logs cobean-backend

# Nginx 日志
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# 系统日志
sudo journalctl -u nginx -f
```

## 性能优化建议

1. **启用 Gzip 压缩** (在 Nginx 中配置)
2. **设置适当的缓存策略**
3. **使用 CDN** 加速静态资源
4. **监控应用性能** 使用 PM2 Plus 或其他监控工具
5. **定期更新依赖** 保持安全性

## 安全建议

1. **定期更新系统和依赖包**
2. **使用强密码和密钥认证**
3. **配置防火墙规则**
4. **启用 HTTPS**
5. **定期备份重要数据**
6. **监控异常访问日志**

---

**注意**: 请根据实际情况调整配置，确保所有敏感信息（如 API 密钥、数据库连接等）的安全性。