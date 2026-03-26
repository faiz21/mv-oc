# MV-Companion OS — Operational Commands
# Ref: system-architecture.md section 13

DB_URL ?= postgresql://postgres:$(POSTGRES_PASSWORD)@localhost:5432/postgres

.PHONY: up down logs migrate functions deploy-app openclaw-start openclaw-open openclaw-logs openclaw-doctor backup status

## Start full stack
up:
	docker compose up -d

## Stop stack (data volumes are preserved)
down:
	docker compose down

## View logs — all services
logs:
	docker compose logs -f

## Apply all pending DB migrations
migrate:
	supabase db push --db-url $(DB_URL)

## Deploy all Edge Functions to self-hosted runtime
functions:
	supabase functions deploy --project-ref local

## Rebuild and redeploy only the Next.js app (zero-downtime)
deploy-app:
	docker compose build app
	docker compose up -d --no-deps app

## View OpenClaw logs
openclaw-logs:
	./openclaw logs

## Run OpenClaw doctor (health check)
openclaw-doctor:
	./openclaw doctor

## Start OpenClaw gateway
openclaw-start:
	./openclaw start

## Open OpenClaw UI in the browser
openclaw-open:
	./openclaw open

## Backup database to /backups/
backup:
	mkdir -p /backups
	docker exec mv_db pg_dump -U postgres postgres | gzip > /backups/db-$$(date +%Y%m%d-%H%M%S).sql.gz
	@echo "Backup saved to /backups/"

## Show status of all containers
status:
	docker compose ps
