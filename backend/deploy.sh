#!/bin/bash

# 部署配置
SERVER_IP="47.88.107.235"
SERVER_USER="root"  # 根据实际情况修改用户名
SERVER_PATH="/www/wwwroot/backend"
LOCAL_PATH="."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}开始同步文件到服务器${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否在 backend 目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误：请在 backend 目录下运行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}正在同步文件到服务器...${NC}"
# 使用 rsync 同步文件，排除不需要的文件
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude 'deploy.sh' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    --exclude 'uploads' \
    ${LOCAL_PATH}/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/

if [ $? -ne 0 ]; then
    echo -e "${RED}文件同步失败！${NC}"
    exit 1
fi

echo -e "${GREEN}文件同步完成！${NC}"

echo -e "${YELLOW}正在修改文件所有者为 www...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} "chown -R www:www ${SERVER_PATH}"

if [ $? -ne 0 ]; then
    echo -e "${RED}修改文件所有者失败！${NC}"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"

