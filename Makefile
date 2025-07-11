# OnlyOffice Web Docker 快捷命令
.PHONY: help build up down restart logs ps clean dev dev-up dev-down dev-logs dev-shell prod health

# 默认目标
help:
	@echo "OnlyOffice Web Docker 快捷命令"
	@echo ""
	@echo "生产环境:"
	@echo "  make build     - 构建生产镜像"
	@echo "  make up        - 启动生产环境"
	@echo "  make down      - 停止生产环境"
	@echo "  make restart   - 重启生产环境"
	@echo "  make logs      - 查看生产环境日志"
	@echo "  make ps        - 查看服务状态"
	@echo "  make health    - 健康检查"
	@echo ""
	@echo "开发环境:"
	@echo "  make dev       - 启动开发环境（同 dev-up）"
	@echo "  make dev-up    - 启动开发环境"
	@echo "  make dev-down  - 停止开发环境"
	@echo "  make dev-logs  - 查看开发环境日志"
	@echo "  make dev-shell - 进入开发容器"
	@echo ""
	@echo "维护:"
	@echo "  make clean     - 清理未使用的镜像和容器"
	@echo "  make rebuild   - 强制重新构建"

# 生产环境命令
build:
	@echo "🔨 构建生产镜像..."
	docker-compose build

up:
	@echo "🚀 启动生产环境..."
	docker-compose up -d
	@echo "✅ 生产环境已启动"
	@echo "🌐 访问: http://localhost:3000/"

down:
	@echo "🛑 停止生产环境..."
	docker-compose down
	@echo "✅ 生产环境已停止"

restart:
	@echo "🔄 重启生产环境..."
	docker-compose restart
	@echo "✅ 生产环境已重启"

logs:
	@echo "📋 查看生产环境日志..."
	docker-compose logs -f

ps:
	@echo "📊 查看服务状态..."
	docker-compose ps

health:
	@echo "🏥 执行健康检查..."
	@docker exec onlyoffice-web curl -f http://localhost/health || echo "❌ 健康检查失败"

# 开发环境命令
dev: dev-up

dev-up:
	@echo "🚀 启动开发环境..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ 开发环境已启动"
	@echo "🌐 访问: http://localhost:5173/"

dev-down:
	@echo "🛑 停止开发环境..."
	docker-compose -f docker-compose.dev.yml down
	@echo "✅ 开发环境已停止"

dev-logs:
	@echo "📋 查看开发环境日志..."
	docker-compose -f docker-compose.dev.yml logs -f

dev-shell:
	@echo "🐚 进入开发容器..."
	docker-compose -f docker-compose.dev.yml exec onlyoffice-web-dev sh

# 维护命令
clean:
	@echo "🧹 清理未使用的镜像和容器..."
	docker system prune -f
	docker image prune -f
	@echo "✅ 清理完成"

rebuild:
	@echo "🔨 强制重新构建..."
	docker-compose build --no-cache
	@echo "✅ 重新构建完成"

# 复合命令
prod: build up
	@echo "🎉 生产环境部署完成!"

dev-fresh: dev-down clean dev-up
	@echo "🎉 开发环境全新启动完成!"

# 信息命令
info:
	@echo "📋 系统信息:"
	@echo "Docker 版本: $(shell docker --version)"
	@echo "Docker Compose 版本: $(shell docker-compose --version)"
	@echo ""
	@echo "📦 项目镜像:"
	@docker images | grep onlyoffice-web || echo "暂无项目镜像"
	@echo ""
	@echo "🔗 有用的链接:"
	@echo "  生产环境: http://localhost:3000/"
	@echo "  开发环境: http://localhost:5173/"
	@echo "  健康检查: http://localhost:3000/health" 