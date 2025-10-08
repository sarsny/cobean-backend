# Cobean Backend 服务器代码更新指南

## 🚀 快速更新流程

### 方法一：使用自动化部署脚本（推荐）

```bash
# 1. 连接服务器
ssh root@47.116.161.64

# 2. 进入项目目录
cd /var/www/cobean-backend

# 3. 停止当前服务
pm2 stop cobean-backend

# 4. 运行部署脚本
./deploy.sh

# 5. 重新安装依赖（如果 package.json 有变化）
rm -rf node_modules package-lock.json
npm install

# 6. 重新构建项目
npm run build

# 7. 启动服务
pm2 start ecosystem.config.js
```

### 方法二：手动更新步骤

```bash
# 1. 连接服务器
ssh root@47.116.161.64

# 2. 进入项目目录
cd /var/www/cobean-backend

# 3. 停止应用（可选，避免更新时的冲突）
pm2 stop cobean-backend

# 4. 拉取最新代码
git pull origin main

# 5. 安装新的依赖（如果有）
npm install

# 6. 重新构建项目
npm run build

# 7. 重启应用
pm2 restart cobean-backend

# 8. 检查应用状态
pm2 status
pm2 logs cobean-backend --lines 50
```

## 📋 详细更新步骤

### 1. 准备工作

#### 检查当前状态
```bash
# 查看当前应用状态
pm2 status

# 查看当前代码版本
git log --oneline -5

# 查看是否有未提交的更改
git status
```

#### 备份当前版本（可选）
```bash
# 创建备份分支
git checkout -b backup-$(date +%Y%m%d-%H%M%S)
git checkout main
```

### 2. 更新代码

#### 拉取最新代码
```bash
# 获取远程更新
git fetch origin

# 查看即将更新的内容
git log HEAD..origin/main --oneline

# 拉取并合并更新
git pull origin main
```

#### 处理冲突（如果有）
```bash
# 如果有冲突，手动解决后
git add .
git commit -m "Resolve merge conflicts"
```

### 3. 更新依赖和构建

#### 检查依赖更新
```bash
# 查看 package.json 是否有变化
git diff HEAD~1 package.json

# 如果有依赖更新，重新安装
npm install

# 清理缓存（如果需要）
npm cache clean --force
```

#### 重新构建项目
```bash
# 清理旧的构建文件
rm -rf dist/

# 重新构建
npm run build

# 验证构建结果
ls -la dist/
```

### 4. 更新环境配置

#### 检查环境变量更新
```bash
# 比较环境变量模板
diff .env .env.example

# 如果有新的环境变量，更新 .env 文件
nano .env
```

#### 检查配置文件更新
```bash
# 检查 PM2 配置是否有更新
git diff HEAD~1 ecosystem.config.js

# 检查 Nginx 配置是否有更新
git diff HEAD~1 nginx.conf
```

### 5. 重启服务

#### 重启应用
```bash
# 方式一：重启应用（推荐）
pm2 restart cobean-backend

# 方式二：重新加载（零停机时间）
pm2 reload cobean-backend

# 方式三：完全重启
pm2 delete cobean-backend
pm2 start ecosystem.config.js
```

#### 更新 Nginx 配置（如果需要）
```bash
# 如果 nginx.conf 有更新
sudo cp nginx.conf /etc/nginx/sites-available/cobean-backend

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl reload nginx
```

### 6. 验证更新

#### 检查应用状态
```bash
# 查看 PM2 状态
pm2 status

# 查看应用日志
pm2 logs cobean-backend --lines 20

# 监控应用
pm2 monit
```

#### 测试 API 功能
```bash
# 健康检查
curl http://47.116.161.64/health

# 测试主要 API 端点
curl http://47.116.161.64/api/thoughts
curl http://47.116.161.64/api/chats
```

#### 检查系统资源
```bash
# 查看内存使用
free -h

# 查看 CPU 使用
top

# 查看磁盘空间
df -h
```

## 🔄 回滚操作

如果更新后出现问题，可以快速回滚：

### 方法一：Git 回滚
```bash
# 查看提交历史
git log --oneline -10

# 回滚到上一个版本
git reset --hard HEAD~1

# 重新构建和重启
npm run build
pm2 restart cobean-backend
```

### 方法二：使用备份分支
```bash
# 切换到备份分支
git checkout backup-YYYYMMDD-HHMMSS

# 重新构建和重启
npm run build
pm2 restart cobean-backend
```

## 📊 监控和日志

### 实时监控
```bash
# PM2 监控面板
pm2 monit

# 实时日志
pm2 logs cobean-backend -f

# 系统资源监控
htop
```

### 日志分析
```bash
# 查看错误日志
pm2 logs cobean-backend --err

# 查看最近的日志
pm2 logs cobean-backend --lines 100

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🛠️ 故障排查

### 常见问题

1. **构建失败**
```bash
# 清理 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
npm run build
```

2. **端口冲突**
```bash
# 查看端口占用
sudo lsof -i :3000
# 杀死占用进程
sudo kill -9 <PID>
```

3. **权限问题**
```bash
# 修复文件权限
sudo chown -R $USER:$USER /var/www/cobean-backend
chmod +x deploy.sh
```

4. **内存不足**
```bash
# 增加 swap 空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📝 更新检查清单

- [ ] 备份当前版本
- [ ] 拉取最新代码
- [ ] 检查依赖更新
- [ ] 重新构建项目
- [ ] 更新环境配置
- [ ] 重启应用服务
- [ ] 验证功能正常
- [ ] 检查日志无错误
- [ ] 监控系统资源

## 🔔 自动化建议

### 设置 Git Hooks
```bash
# 创建 post-receive hook
cat > .git/hooks/post-receive << 'EOF'
#!/bin/bash
cd /var/www/cobean-backend
npm install
npm run build
pm2 restart cobean-backend
EOF

chmod +x .git/hooks/post-receive
```

### 定时健康检查
```bash
# 添加到 crontab
crontab -e

# 每5分钟检查一次应用状态
*/5 * * * * /usr/bin/pm2 ping cobean-backend || /usr/bin/pm2 restart cobean-backend
```

---

**注意**: 
- 在生产环境更新前，建议先在测试环境验证
- 重要更新前请做好数据备份
- 如遇到问题，及时查看日志并考虑回滚