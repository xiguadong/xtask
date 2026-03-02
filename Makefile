GOPROXY ?= https://goproxy.cn,direct

.PHONY: frontend-install frontend-build backend-test backend-build e2e-test test build

frontend-install:
	cd frontend && npm install

frontend-build:
	cd frontend && npm run build
	mkdir -p backend/frontend_dist
	rm -rf backend/frontend_dist/*
	cp -r frontend/dist/* backend/frontend_dist/

backend-test:
	cd backend && GOPROXY=$(GOPROXY) go test ./...

backend-build:
	cd backend && GOPROXY=$(GOPROXY) go build -o ../bin/xtask .

e2e-test:
	cd e2e && npm test

test: backend-test
	cd frontend && npm run build

build: frontend-build backend-build
	@echo "Built ./bin/xtask"
