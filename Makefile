# Develop
all : 
	docker compose -f docker/docker-compose.yml up

build :
	docker compose -f docker/docker-compose.yml build --no-cache

clean :
	docker compose -f docker/docker-compose.yml down

fclean :
	docker compose -f docker/docker-compose.yml down -v
	docker image rm -f nestjs:alpine postgres:alpine

# Test 
test :
	docker compose -f docker/docker-compose-test.yml up

tclean :
	docker compose -f docker/docker-compose-test.yml down
	
tfclean :
	docker compose -f docker/docker-compose-test.yml down -v
	docker image rm -f nestjs-test:alpine

.PHONY : all build clean fclean test tclean tfclean
