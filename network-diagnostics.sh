#!/bin/bash

echo "🔍 网络连接诊断脚本"
echo "=================================="

# 检查DNS解析
echo "📡 检查DNS解析..."
echo "nslookup vyfbbniyaafjjygnzusn.supabase.co"
nslookup vyfbbniyaafjjygnzusn.supabase.co

echo ""
echo "📡 检查dig解析..."
echo "dig vyfbbniyaafjjygnzusn.supabase.co"
dig vyfbbniyaafjjygnzusn.supabase.co

# 检查网络连接
echo ""
echo "🌐 检查HTTPS连接..."
echo "curl -I https://vyfbbniyaafjjygnzusn.supabase.co"
curl -I https://vyfbbniyaafjjygnzusn.supabase.co

echo ""
echo "🌐 检查ping连接..."
echo "ping -c 4 vyfbbniyaafjjygnzusn.supabase.co"
ping -c 4 vyfbbniyaafjjygnzusn.supabase.co

# 检查防火墙和端口
echo ""
echo "🔥 检查端口连接..."
echo "telnet vyfbbniyaafjjygnzusn.supabase.co 443"
timeout 5 telnet vyfbbniyaafjjygnzusn.supabase.co 443 || echo "连接超时或失败"

# 检查系统DNS配置
echo ""
echo "⚙️ 检查系统DNS配置..."
echo "cat /etc/resolv.conf"
cat /etc/resolv.conf

# 检查网络接口
echo ""
echo "🔌 检查网络接口..."
echo "ip route show"
ip route show || route -n

# 检查iptables规则（如果有权限）
echo ""
echo "🛡️ 检查防火墙规则..."
echo "iptables -L -n"
sudo iptables -L -n 2>/dev/null || echo "无法检查iptables规则（权限不足）"

echo ""
echo "=================================="
echo "✅ 网络诊断完成"
echo ""
echo "📝 如果发现问题："
echo "   1. DNS解析失败 -> 检查DNS服务器配置"
echo "   2. 网络连接失败 -> 检查防火墙和网络配置"
echo "   3. 端口被阻止 -> 检查iptables或云服务商安全组"
echo "   4. 服务器网络问题 -> 联系云服务商技术支持"