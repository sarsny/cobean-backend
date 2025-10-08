#!/bin/bash

# Cobean Backend 综合修复脚本
# 解决 Node.js 版本升级和 ES Module 兼容性问题

set -e  # 遇到错误时退出

echo "🔧 Cobean Backend 综合修复脚本"
echo "=================================="

# 1. 检查当前 Node.js 版本
echo "📋 检查当前 Node.js 版本..."
CURRENT_NODE_VERSION=$(node --version)
echo "📍 当前 Node.js 版本: $CURRENT_NODE_VERSION"

# 2. 升级 Node.js 到 20.x LTS
echo ""
echo "🚀 升级 Node.js 到 20.x LTS..."

# 检查是否已安装 nvm
if command -v nvm &> /dev/null; then
    echo "✅ 检测到 nvm，使用 nvm 升级..."
    source ~/.bashrc
    nvm install 20
    nvm use 20
    nvm alias default 20
else
    echo "📦 安装 Node.js 20.x LTS..."
    # 使用 NodeSource 仓库安装 Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. 验证 Node.js 版本
echo ""
echo "✅ 验证 Node.js 版本..."
NEW_NODE_VERSION=$(node --version)
echo "📍 新的 Node.js 版本: $NEW_NODE_VERSION"

if [[ $NEW_NODE_VERSION == v20* ]]; then
    echo "✅ Node.js 升级成功！"
else
    echo "❌ Node.js 升级失败，当前版本: $NEW_NODE_VERSION"
    exit 1
fi

# 4. 停止现有服务
echo ""
echo "🛑 停止现有服务..."
pm2 stop all || echo "⚠️  没有运行中的 PM2 进程"
pm2 delete all || echo "⚠️  没有需要删除的 PM2 进程"

# 5. 进入项目目录
echo ""
echo "📂 进入项目目录..."
cd /var/www/cobean-backend || { echo "❌ 项目目录不存在"; exit 1; }

# 6. 拉取最新代码
echo ""
echo "📥 拉取最新代码..."
git pull origin main

# 7. 完全清理旧的依赖和构建文件
echo ""
echo "🧹 清理旧的依赖和构建文件..."
rm -rf node_modules
rm -f package-lock.json
rm -rf dist

# 8. 重新安装依赖
echo ""
echo "📦 重新安装依赖..."
npm install

# 9. 验证 uuid 版本
echo ""
echo "🔍 验证 uuid 版本..."
npm list uuid

# 10. 重新构建项目
echo ""
echo "🔨 重新构建项目..."
npm run build

# 11. 启动服务
echo ""
echo "🚀 启动服务..."
pm2 start ecosystem.config.js

# 12. 保存 PM2 配置
echo ""
echo "💾 保存 PM2 配置..."
pm2 save

# 13. 检查服务状态
echo ""
echo "📊 检查服务状态..."
sleep 3
pm2 list

# 14. 验证服务健康状态
echo ""
echo "🏥 验证服务健康状态..."
sleep 5

# 检查服务是否正常运行
if pm2 list | grep -q "online"; then
    echo "✅ 服务启动成功！"
    
    # 测试 API 端点
    echo ""
    echo "🧪 测试 API 端点..."
    if curl -f -s -I http://localhost:3000/api/health > /dev/null; then
        echo "✅ API 健康检查通过！"
    else
        echo "⚠️  API 健康检查失败，请检查日志"
        pm2 logs cobean-backend --lines 10
    fi
else
    echo "❌ 服务启动失败，查看错误日志："
    pm2 logs cobean-backend --lines 20
    exit 1
fi

echo ""
echo "🎉 修复完成！"
echo "=================================="
echo "✅ Node.js 已升级到: $(node --version)"
echo "✅ ES Module 兼容性问题已修复"
echo "✅ 服务已重新启动"
echo ""
echo "📝 后续验证命令："
echo "   pm2 list                    # 检查服务状态"
echo "   pm2 logs cobean-backend     # 查看服务日志"
echo "   curl -I http://localhost:3000/api/health  # 测试 API"