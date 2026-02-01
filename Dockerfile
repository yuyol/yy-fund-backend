# 使用 Node + Python 的基础镜像
FROM node:18-bullseye

# 安装 Python3 和 pip
RUN apt-get update && apt-get install -y python3 python3-pip

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 1. npm install
RUN npm install

# 复制全部代码
COPY . .

# 2. pip install akshare --upgrade
RUN pip3 install akshare --upgrade

# 3. npm run build
RUN npm run build

# 启动命令
CMD ["node", "dist/main.js"]
