FROM node:20-alpine3.18

RUN apk update && \
    apk upgrade

WORKDIR /home

CMD ["sh", "./script.sh"]