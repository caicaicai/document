# OnlyOffice Web - Docker 部署指南

本项目提供了完整的Docker化解决方案，支持开发和生产环境的容器化部署。

## 🚀 快速开始

### 生产环境部署

```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f onlyoffice-web
```

访问 `http://localhost:3000/` 查看应用。

### 开发环境

```bash
# 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 查看开发日志（包含热重载信息）
docker-compose -f docker-compose.dev.yml logs -f onlyoffice-web-dev
```

访问 `http://localhost:5173/` 查看开发版本。

## 📁 文件结构

```
├── Dockerfile              # 生产环境镜像
├── Dockerfile.dev          # 开发环境镜像
├── docker-compose.yml      # 生产环境配置
├── docker-compose.dev.yml  # 开发环境配置
├── nginx.conf              # Nginx配置文件
├── .dockerignore           # Docker忽略文件
└── Docker-README.md        # 本文档
```

## 🔧 配置说明

### 生产环境 (docker-compose.yml)

- **端口映射**: `3000:80` - 将容器的80端口映射到宿主机的3000端口
- **健康检查**: 每30秒检查 `/health` 端点
- **自动重启**: 容器异常退出时自动重启
- **Traefik标签**: 预配置了反向代理标签（需要Traefik）

### 开发环境 (docker-compose.dev.yml)

- **端口映射**: 
  - `5173:5173` - Vite开发服务器
  - `4173:4173` - Vite预览服务器
- **卷挂载**: 源代码实时同步，支持热重载
- **开发工具**: 包含完整的开发依赖

### Nginx配置特性

- **Gzip压缩**: 启用多种文件类型压缩
- **缓存策略**: 静态资源长期缓存，HTML文件不缓存
- **安全头**: 添加基本的安全响应头
- **SPA路由**: 正确处理前端路由
- **WASM支持**: 正确设置WASM文件MIME类型

## 📚 常用命令

### 基本操作

```bash
# 构建镜像
docker-compose build

# 启动服务（后台运行）
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f
```

### 镜像管理

```bash
# 强制重新构建
docker-compose build --no-cache

# 清理未使用的镜像
docker image prune

# 查看镜像大小
docker images | grep onlyoffice-web
```

### 开发环境操作

```bash
# 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 进入开发容器
docker-compose -f docker-compose.dev.yml exec onlyoffice-web-dev sh

# 在容器内运行命令
docker-compose -f docker-compose.dev.yml exec onlyoffice-web-dev pnpm run build

# 停止开发环境
docker-compose -f docker-compose.dev.yml down
```

## 🌐 环境变量

在生产环境中，您可以通过环境变量自定义配置：

```bash
# 创建 .env 文件
cat > .env << EOF
# 服务端口
HOST_PORT=3000

# 域名配置（用于Traefik）
DOMAIN=your-domain.com

# SSL证书解析器
CERT_RESOLVER=letsencrypt
EOF

# 使用环境变量启动
docker-compose up -d
```

## 🔧 自定义配置

### 修改端口

编辑 `docker-compose.yml`：

```yaml
services:
  onlyoffice-web:
    ports:
      - "8080:80"  # 改为8080端口
```

### 自定义Nginx配置

1. 修改 `nginx.conf` 文件
2. 重新构建镜像：`docker-compose build`
3. 重启服务：`docker-compose up -d`

### 添加SSL证书

如果使用Traefik，更新 `docker-compose.yml` 中的标签：

```yaml
labels:
  - "traefik.http.routers.onlyoffice-web.rule=Host(`your-domain.com`)"
  - "traefik.http.routers.onlyoffice-web.tls=true"
  - "traefik.http.routers.onlyoffice-web.tls.certresolver=letsencrypt"
```

## 📊 监控和维护

### 健康检查

```bash
# 检查容器健康状态
docker-compose ps

# 手动执行健康检查
docker exec onlyoffice-web curl -f http://localhost/health
```

### 日志管理

```bash
# 查看最近100行日志
docker-compose logs --tail=100

# 查看特定服务日志
docker-compose logs onlyoffice-web

# 跟踪实时日志
docker-compose logs -f --tail=50
```

### 性能优化

1. **内存限制**：
```yaml
services:
  onlyoffice-web:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

2. **重启策略**：
```yaml
restart: unless-stopped
```

## 🐛 故障排除

### 常见问题

1. **端口占用**
```bash
# 检查端口使用情况
sudo netstat -tulpn | grep 3000

# 更改端口或停止占用进程
```

2. **构建失败**
```bash
# 清理构建缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

3. **WASM文件加载失败**
```bash
# 检查nginx配置
docker exec onlyoffice-web nginx -t

# 查看文件权限
docker exec onlyoffice-web ls -la /usr/share/nginx/html/wasm/
```

4. **内存不足**
```bash
# 增加Docker内存限制
# 在Docker Desktop中调整资源设置
```

### 调试技巧

1. **进入容器调试**：
```bash
docker exec -it onlyoffice-web sh
```

2. **查看详细日志**：
```bash
docker-compose logs --details
```

3. **网络连接测试**：
```bash
docker exec onlyoffice-web wget -O- http://localhost/health
```

## 🚀 生产部署建议

1. **使用反向代理**: 推荐使用Nginx或Traefik作为反向代理
2. **SSL证书**: 为生产环境配置HTTPS
3. **资源限制**: 设置合适的CPU和内存限制
4. **日志轮转**: 配置日志轮转防止磁盘空间不足
5. **监控**: 集成健康检查和监控系统
6. **备份**: 定期备份容器配置和数据

## 📖 相关资源

- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [Nginx配置参考](https://nginx.org/en/docs/)
- [Traefik文档](https://doc.traefik.io/traefik/)

## 💡 技术支持

如果遇到问题，请按以下步骤排查：

1. 检查容器状态：`docker-compose ps`
2. 查看日志：`docker-compose logs`
3. 验证配置：`docker exec onlyoffice-web nginx -t`
4. 检查网络：`docker network ls`

如果问题仍然存在，请提供详细的错误日志和环境信息。 