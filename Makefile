IMAGE_NAME ?= small-pool-show
VERSION_TAG ?= local
PORT ?= 8080

.PHONY: install dev test build docker-build docker-run

install:
	npm ci

dev:
	npm run dev -- --host 0.0.0.0

test:
	node scripts/jsx-runtime.test.mjs

build: test
	npm run build

docker-build:
	docker build --pull -t $(IMAGE_NAME):$(VERSION_TAG) .

docker-run:
	docker run --rm -p $(PORT):80 $(IMAGE_NAME):$(VERSION_TAG)
