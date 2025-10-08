#!/bin/bash

# Cobean Backend 服务器修复脚本
# 解决 ES Module 兼容性问题

echo "=== Cobean Backend 服务修复 ==="

# 1. 停止所有 cobean-backend 进程
echo "1. 停止所有服务进程..."
pm2 delete cobean-backend

# 2. 进入项目目录
echo "2. 进入项目目录..."
cd /var/www/cobean-backend

# 3. 拉取最新代码
echo "3. 拉取最新代码..."
git pull origin main

# 4. 清理旧的依赖
echo "4. 清理旧的依赖..."
rm -rf node_modules package-lock.json

# 5. 重新安装依赖
echo "5. 重新安装依赖..."
npm install

# 6. 重新构建项目
echo "6. 重新构建项目..."
npm run build

# 7. 启动服务
echo "7. 启动服务..."
pm2 start ecosystem.config.js

# 8. 保存 PM2 配置
echo "8. 保存 PM2 配置..."
pm2 save

# 9. 检查服务状态
echo "9. 检查服务状态..."
pm2 status

echo "=== 修复完成 ==="
echo "请检查服务状态，如果仍有问题，请查看日志："
echo "pm2 logs cobean-backend"