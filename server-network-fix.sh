#!/bin/bash

echo "🔧 服务器网络连接修复脚本"
echo "=================================="

# 检查当前用户权限
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  注意：某些操作需要root权限，建议使用sudo运行此脚本"
fi

# 1. 更新DNS配置
echo "📡 步骤1: 更新DNS配置..."
echo "备份当前DNS配置..."
sudo cp /etc/resolv.conf /etc/resolv.conf.backup.$(date +%Y%m%d_%H%M%S)

echo "添加可靠的DNS服务器..."
sudo tee /etc/resolv.conf > /dev/null <<EOF
# Google DNS
nameserver 8.8.8.8
nameserver 8.8.4.4
# Cloudflare DNS
nameserver 1.1.1.1
nameserver 1.0.0.1
# 原有DNS（如果存在）
$(grep -v "^nameserver [18]" /etc/resolv.conf.backup.* 2>/dev/null | tail -1 | cut -d: -f2- || echo "")
EOF

# 2. 刷新DNS缓存
echo ""
echo "🔄 步骤2: 刷新DNS缓存..."
if command -v systemd-resolve >/dev/null 2>&1; then
    sudo systemd-resolve --flush-caches
    echo "✅ systemd DNS缓存已刷新"
elif command -v nscd >/dev/null 2>&1; then
    sudo service nscd restart
    echo "✅ nscd DNS缓存已刷新"
else
    echo "⚠️  未找到DNS缓存服务，跳过缓存刷新"
fi

# 3. 检查并修复网络配置
echo ""
echo "🌐 步骤3: 检查网络配置..."
echo "当前路由表："
ip route show

echo ""
echo "当前网络接口："
ip addr show

# 4. 检查防火墙规则
echo ""
echo "🛡️ 步骤4: 检查防火墙规则..."
if command -v ufw >/dev/null 2>&1; then
    echo "UFW状态："
    sudo ufw status
    echo "确保允许HTTPS出站连接..."
    sudo ufw allow out 443/tcp
elif command -v iptables >/dev/null 2>&1; then
    echo "iptables规则："
    sudo iptables -L -n | grep -E "(443|HTTPS|OUTPUT)"
    echo "添加HTTPS出站规则（如果需要）..."
    sudo iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || echo "规则可能已存在"
fi

# 5. 测试网络连接
echo ""
echo "🧪 步骤5: 测试网络连接..."
echo "测试DNS解析..."
nslookup vyfbbniyaafjjygnzusn.supabase.co

echo ""
echo "测试HTTPS连接..."
curl -I --connect-timeout 10 https://vyfbbniyaafjjygnzusn.supabase.co

echo ""
echo "测试ping连接..."
ping -c 3 vyfbbniyaafjjygnzusn.supabase.co

# 6. 检查Node.js网络配置
echo ""
echo "🟢 步骤6: 检查Node.js网络配置..."
echo "Node.js版本: $(node --version)"
echo "npm配置："
npm config list | grep -E "(proxy|registry)"

# 7. 重启网络服务
echo ""
echo "🔄 步骤7: 重启网络服务..."
if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl restart networking 2>/dev/null || echo "networking服务重启失败或不存在"
    sudo systemctl restart systemd-networkd 2>/dev/null || echo "systemd-networkd服务重启失败或不存在"
    sudo systemctl restart systemd-resolved 2>/dev/null || echo "systemd-resolved服务重启失败或不存在"
fi

# 8. 最终测试
echo ""
echo "✅ 步骤8: 最终连接测试..."
echo "测试Supabase连接..."
if curl -s --connect-timeout 10 https://vyfbbniyaafjjygnzusn.supabase.co >/dev/null; then
    echo "✅ Supabase连接成功！"
else
    echo "❌ Supabase连接仍然失败"
    echo ""
    echo "🔍 进一步排查建议："
    echo "   1. 检查云服务商安全组设置"
    echo "   2. 检查服务器防火墙配置"
    echo "   3. 联系云服务商技术支持"
    echo "   4. 检查Supabase项目状态"
fi

echo ""
echo "=================================="
echo "🏁 网络修复脚本执行完成"
echo ""
echo "📝 如果问题仍然存在，请："
echo "   1. 运行 ./network-diagnostics.sh 进行详细诊断"
echo "   2. 检查服务器所在地区的网络限制"
echo "   3. 考虑使用代理或VPN"
echo "   4. 联系系统管理员或云服务商"