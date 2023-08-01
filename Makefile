all : .all_check

# Develop
.all_check :
	docker compose -f docker/docker-compose.yml up
	touch $@

build :
	docker compose -f docker/docker-compose.yml build --no-cache
	touch $@

clean :
	rm -f .all_check
	docker compose -f docker/docker-compose.yml down

fclean :
	make clean
	docker compose -f docker/docker-compose.yml down -v
	docker image rm -f nestjs:alpine postgresql:alpine

# Test 
test :
	docker compose -f docker/docker-compose-test.yml up

tclean :
	docker compose -f docker/docker-compose-test.yml down
	
tfclean :
	make tclean
	docker compose -f docker/docker-compose-test.yml down -v

.PHONY : all build clean fclean test tclean tfclean
