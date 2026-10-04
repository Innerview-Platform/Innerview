# InnerView — local development (no image builds).
#
#   make dev       start supporting containers, then run backend, whiteboard server and frontend locally (Ctrl+C stops all)
#   make infra     start only the supporting containers (Piston, Redis, DynamoDB, LiveKit)
#   make backend   run the Spring Boot backend on :8080
#   make canvas    run the Excalidraw whiteboard sync server on :5858
#   make editor    run the Hocuspocus server (shared code editor + notes) on :1234
#   make frontend  run the Vite dev server on :3000
#   make kill      stop whatever is listening on the dev ports (e.g. a `make dev` left running elsewhere)
#   make stop      stop the supporting containers
#   make piston-langs  install the code runner's languages into Piston (once per machine)
#
# The backend uses the local MySQL database configured in .env.

JAVA_HOME ?= /usr/lib/jvm/java-21-openjdk-amd64
INFRA := piston redis dynamodb livekit

# Must match .env (FRONTEND_PORT, CANVAS_PORT, BACKEND_PORT).
FRONTEND_PORT ?= 3000
CANVAS_PORT ?= 5858
EDITOR_PORT ?= 1234
BACKEND_PORT ?= 8080
DEV_PORTS := $(FRONTEND_PORT) $(CANVAS_PORT) $(EDITOR_PORT) $(BACKEND_PORT)

.PHONY: dev check-ports kill infra backend canvas editor frontend stop piston-langs

dev: check-ports infra
	@$(MAKE) --no-print-directory -j4 backend canvas editor frontend

# Fail fast (instead of half-starting) when another instance already holds a dev port.
check-ports:
	@busy=0; for port in $(DEV_PORTS); do \
		pids=$$(lsof -t -iTCP:$$port -sTCP:LISTEN 2>/dev/null); \
		if [ -n "$$pids" ]; then \
			busy=1; echo "Port $$port is already in use by:"; \
			for pid in $$pids; do echo "  $$(ps -o pid=,args= -p $$pid | cut -c1-120)"; done; \
		fi; \
	done; \
	if [ $$busy -eq 1 ]; then echo "Another 'make dev' is probably still running. Stop it with Ctrl+C, or run 'make kill'."; exit 1; fi

kill:
	@for port in $(DEV_PORTS); do \
		pids=$$(lsof -t -iTCP:$$port -sTCP:LISTEN 2>/dev/null); \
		if [ -n "$$pids" ]; then echo "Stopping port $$port (pid $$(echo $$pids))"; kill $$pids; fi; \
	done; true

infra:
	docker compose up -d --no-build $(INFRA)

backend:
	cd services/spring-boot && JAVA_HOME=$(JAVA_HOME) ./mvnw spring-boot:run

canvas:
	@test -d services/nodejs/collaboration-canvas/node_modules || npm --prefix services/nodejs/collaboration-canvas ci
	npm --prefix services/nodejs/collaboration-canvas run dev

editor:
	@test -d services/nodejs/collaboration-editor/node_modules || npm --prefix services/nodejs/collaboration-editor ci
	npm --prefix services/nodejs/collaboration-editor run dev

frontend:
	@test -d frontend/node_modules || npx -y pnpm@10 --dir frontend install
	npm --prefix frontend run dev

stop:
	docker compose stop $(INFRA)

piston-langs:
	docker compose up -d --no-build piston
	./scripts/piston-install-languages.sh
