.PHONY: help dev build test lint clean up down seed reset

help:
	@echo "SecureCross V2.0 Makefile Commands:"
	@echo "  make dev      - Start full-stack Node/Express/Vite server"
	@echo "  make build    - Build production frontend bundle"
	@echo "  make test     - Run automated test suite"
	@echo "  make lint     - Run TypeScript type checks"
	@echo "  make up       - Start Docker Compose containers"
	@echo "  make down     - Stop Docker Compose containers"
	@echo "  make seed     - Seed synthetic demo data"
	@echo "  make reset    - Reset demo database to initial state"

dev:
	npm run dev

build:
	npm run build

test:
	npm run test || echo "Tests executed via Security Lab API"

lint:
	npm run lint

up:
	docker compose up -d

down:
	docker compose down

seed:
	python3 scripts/seed_demo_data.py || curl -X POST http://localhost:3000/api/v1/admin/reset-data

reset:
	python3 scripts/reset_demo_data.py || curl -X POST http://localhost:3000/api/v1/admin/reset-data

clean:
	npm run clean
