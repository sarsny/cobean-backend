#!/bin/bash

# Cobean Backend 自动化部署脚本
# 使用方法: ./deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署 Cobean Backend..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录执行此脚本"
    exit 1
fi

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 安装依赖
echo "📦 安装依赖..."
npm install  # 安装所有依赖，包括 TypeScript

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 构建失败: dist 目录不存在"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 重启 PM2 应用
echo "🔄 重启应用..."
if pm2 describe cobean-backend > /dev/null 2>&1; then
    pm2 restart cobean-backend
else
    echo "🆕 首次启动应用..."
    pm2 start ecosystem.config.js
fi

# 保存 PM2 配置
pm2 save

echo "✅ 部署完成！"
echo "📊 应用状态:"
pm2 status cobean-backend

echo ""
echo "🔗 有用的命令:"
echo "  查看日志: pm2 logs cobean-backend"
echo "  监控应用: pm2 monit"
echo "  重启应用: pm2 restart cobean-backend"