.DEFAULT_GOAL := help
.PHONY: help setup up down seed test lint typecheck dev-api dev-web dev-mobile

API := apps/api
has_api := $(wildcard $(API)/pyproject.toml)

# not_ready <what> <step>: exit with a clear message for targets whose step is not done yet
define not_ready
	@echo "✗ $(1) is not available yet — added in step $(2)." >&2; exit 1
endef

help: ## Show all targets
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

setup: ## Git hooks, toolchain check, install deps
	./scripts/setup.sh

up: ## Start postgres + minio
	$(call not_ready,docker-compose.yml,S-02)

down: ## Stop local infrastructure
	$(call not_ready,docker-compose.yml,S-02)

seed: ## Load demo fixtures into the database
	$(call not_ready,seed,B-09)

test: ## Run all tests
	pnpm turbo run test
ifneq ($(has_api),)
	cd $(API) && uv run pytest
endif

lint: ## Lint everything
	pnpm format:check
	pnpm turbo run lint
ifneq ($(has_api),)
	cd $(API) && uv run ruff check .
endif

typecheck: ## Typecheck everything
	pnpm turbo run typecheck
ifneq ($(has_api),)
	cd $(API) && uv run mypy .
endif

dev-api: ## Run the API dev server
ifeq ($(has_api),)
	$(call not_ready,apps/api,B-01)
else
	cd $(API) && uv run fastapi dev
endif

dev-web: ## Run the web app
	$(if $(wildcard apps/web/package.json),pnpm --filter web dev,$(call not_ready,apps/web,W-01))

dev-mobile: ## Run the mobile PWA
	$(if $(wildcard apps/mobile/package.json),pnpm --filter mobile dev,$(call not_ready,apps/mobile,M-01))
