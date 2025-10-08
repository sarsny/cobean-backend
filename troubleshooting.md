# 部署故障排查指南

## 常见问题及解决方案

### 1. 构建错误

#### `tsc: 未找到命令`
**问题**: TypeScript 编译器未安装
```bash
# 解决方案：安装所有依赖（包括开发依赖）
npm install
npm run build
```

#### Node.js 版本警告

### 问题描述
```
⚠️ Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later.
```

### 解决方案
1. **检查当前版本**
   ```bash
   node -v
   ```

2. **升级到 Node.js 20**
   ```bash
   # 使用 NodeSource 仓库
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # 验证升级
   node -v
   npm -v
   ```

3. **重新部署应用**
   ```bash
   cd /var/www/cobean-backend
   pm2 stop all
   npm install
   npm run build
   pm2 start ecosystem.config.js
   ```

## Error [ERR_REQUIRE_ESM]: require() of ES Module`
**问题**: ES Module 兼容性问题，通常由 uuid 等包的新版本引起
```bash
# 解决方案：
# 1. 停止服务
pm2 stop cobean-backend

# 2. 清理依赖
rm -rf node_modules package-lock.json

# 3. 重新安装依赖
npm install

# 4. 重新构建
npm run build

# 5. 重启服务
pm2 start ecosystem.config.js
```

**注意**: 如果问题持续，检查 package.json 中的包版本，某些包的新版本可能不兼容 CommonJS。

### 2. PM2 启动失败

**问题**: PM2 无法启动应用

**排查步骤**:
```bash
# 检查构建是否成功
ls -la dist/

# 检查入口文件是否存在
ls -la dist/index.js

# 手动测试启动
node dist/index.js

# 查看 PM2 日志
pm2 logs cobean-backend
```

### 3. 环境变量配置错误

**问题**: 应用启动但无法连接数据库或外部服务

**检查清单**:
```bash
# 检查 .env 文件是否存在
ls -la .env

# 验证环境变量格式
cat .env

# 测试数据库连接
node -e "
require('dotenv').config();
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
"
```

### 4. Nginx 配置问题

**问题**: 无法通过域名或 IP 访问应用

**排查步骤**:
```bash
# 检查 Nginx 状态
systemctl status nginx

# 测试 Nginx 配置
nginx -t

# 检查端口占用
netstat -tlnp | grep :80
netstat -tlnp | grep :3000

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### 5. 防火墙问题

**问题**: 外部无法访问服务器

**解决方案**:
```bash
# 检查防火墙状态
ufw status

# 开放必要端口
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable

# 检查阿里云安全组设置
# 确保在阿里云控制台开放了相应端口
```

### 6. 内存不足

**问题**: 应用频繁重启或构建失败

**解决方案**:
```bash
# 检查内存使用
free -h
df -h

# 创建交换文件（如果内存不足）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用交换文件
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 7. Node.js 版本问题

**问题**: 应用无法启动，提示版本不兼容

**解决方案**:
```bash
# 检查 Node.js 版本
node --version

# 项目要求 Node.js >= 18.0.0
# 如果版本过低，重新安装
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 8. 权限问题

**问题**: 文件权限不足

**解决方案**:
```bash
# 修复项目目录权限
sudo chown -R $USER:$USER /var/www/cobean-backend
chmod +x deploy.sh

# 修复日志目录权限
mkdir -p logs
chmod 755 logs
```

## 调试命令

### 查看应用状态
```bash
# PM2 状态
pm2 status
pm2 monit

# 系统资源
htop
df -h
free -h
```

### 查看日志
```bash
# 应用日志
pm2 logs cobean-backend
tail -f logs/combined.log

# 系统日志
journalctl -u nginx
tail -f /var/log/nginx/error.log
```

### 网络测试
```bash
# 测试本地连接
curl http://localhost:3000/health

# 测试外部连接
curl http://47.116.161.64/health

# 检查端口监听
netstat -tlnp | grep :3000
```

## 性能优化

### 1. PM2 配置优化
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cobean-backend',
    script: 'dist/index.js',
    instances: 'max',  // 使用所有 CPU 核心
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
}
```

### 2. Nginx 缓存配置
```nginx
# 在 nginx.conf 中添加
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 数据库连接池优化
检查 Supabase 连接配置，确保使用连接池。

## 联系支持

如果问题仍未解决，请提供以下信息：
1. 错误日志 (`pm2 logs cobean-backend`)
2. 系统信息 (`uname -a`, `node --version`)
3. 配置文件内容（隐藏敏感信息）
4. 具体的错误步骤