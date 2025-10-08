#!/bin/bash

# Cobean Backend 服务器修复脚本
# 解决 ES Module 兼容性问题和 Node.js 版本警告

echo "🔧 开始修复 Cobean Backend 服务..."

# 检查 Node.js 版本
echo "📋 检查 Node.js 版本..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo "当前 Node.js 版本: $(node -v)"

if [ "$node_version" -lt 20 ]; then
    echo "⚠️  警告: 当前 Node.js 版本低于 20，建议升级到 Node.js 20 或更高版本"
    echo "   参考: https://github.com/orgs/supabase/discussions/37217"
    echo "   继续使用当前版本进行修复..."
fi

# 停止所有 PM2 进程
echo "🛑 停止 PM2 进程..."
pm2 stop all
pm2 delete all

# 进入项目目录
echo "📁 进入项目目录..."
cd /var/www/cobean-backend

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 清理依赖和构建文件
echo "🧹 清理依赖和构建文件..."
rm -rf node_modules
rm -f package-lock.json
rm -rf dist

# 重新安装依赖
echo "📦 重新安装依赖..."
npm install

# 验证 uuid 版本
echo "🔍 验证 uuid 版本..."
npm list uuid

# 重新构建项目
echo "🔨 重新构建项目..."
npm run build

# 启动服务
echo "🚀 启动服务..."
pm2 start ecosystem.config.js

# 保存 PM2 配置
echo "💾 保存 PM2 配置..."
pm2 save

# 检查服务状态
echo "📊 检查服务状态..."
pm2 list

echo "✅ 修复完成！"
echo "🔍 验证服务是否正常运行..."
sleep 5
curl -I http://localhost:3000/api/health || echo "❌ 服务可能未正常启动，请检查日志"