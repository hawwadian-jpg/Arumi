.DEFAULT_GOAL := help

.PHONY: help install dev build preview check clean deploy-config cert-check server-key server-setup deploy rollback

help: ## Показать список доступных команд
	@awk 'BEGIN {FS = ":.*## "; printf "Команды проекта:\n\n"} /^[a-zA-Z_-]+:.*## / {printf "  %-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Установить зависимости (нужно выполнить один раз)
	npm install

dev: ## Запустить сайт локально: http://localhost:4321
	npm run dev

build: ## Проверить код и собрать production-версию
	npm run build

preview: build ## Открыть собранную production-версию локально
	npm run preview

check: ## Проверить типы и Astro-компоненты
	npm run check

clean: ## Удалить только автоматически созданные каталоги сборки
	rm -rf dist .astro

deploy-config: ## Создать локальный deploy.env из безопасного примера
	@test ! -e deploy.env || { echo "deploy.env уже существует — файл не изменён"; exit 1; }
	cp deploy.env.example deploy.env
	@echo "Заполните SERVER_HOST в deploy.env"

cert-check: ## Проверить custom-сертификат и соответствие приватному ключу
	./scripts/validate-certificate.sh

server-key: ## Показать SSH fingerprint сервера без изменения known_hosts
	./scripts/check-server-key.sh

server-setup: ## Один раз настроить Ubuntu/Debian, Nginx и HTTPS
	./scripts/setup-server.sh

deploy: ## Собрать и атомарно опубликовать новую версию
	./scripts/deploy.sh

rollback: ## Вернуть предыдущую опубликованную версию
	./scripts/rollback.sh
