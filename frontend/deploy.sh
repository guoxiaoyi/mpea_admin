#!/bin/bash

# 颜色输出函数
function print_green {
  echo -e "\033[32m$1\033[0m"
}

function print_yellow {
  echo -e "\033[33m$1\033[0m"
}

# 设置变量
SERVER_IP="47.88.107.235"
SERVER_USER="root"
SERVER_PATH="/www/wwwroot/admin"

# 开始部署
print_yellow "开始部署..."

# 构建项目
print_yellow "构建项目..."
npm run build

# 检查构建是否成功
if [ $? -ne 0 ]; then
  echo "构建失败，终止部署"
  exit 1
fi

print_green "构建成功！"

# 使用rsync将dist目录同步到服务器
print_yellow "正在上传文件到服务器..."
rsync -avz --delete dist/ $SERVER_USER@$SERVER_IP:$SERVER_PATH

# 检查部署是否成功
if [ $? -ne 0 ]; then
  echo "部署失败，请检查您的网络或服务器配置"
  exit 1
fi

print_green "部署成功！应用已经上线 http://$SERVER_IP:3002"

# # 上传并启动文件编辑器
# print_yellow "正在上传并启动文件编辑器..."
# rsync -avz edit-file.js $SERVER_USER@$SERVER_IP:$SERVER_PATH/

# # 先停止已运行的服务
# print_yellow "正在停止已运行的服务..."
# ssh $SERVER_USER@$SERVER_IP "pkill -f 'node edit-file.js' || true"

# # 在服务器上启动文件编辑器
# print_yellow "正在启动文件编辑器..."
# ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && nohup node edit-file.js > editor.log 2>&1 &"

# print_green "文件编辑器已启动！访问地址：http://$SERVER_IP:5000" 
