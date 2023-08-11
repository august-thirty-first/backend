FROM node:20-alpine3.18

WORKDIR /home

COPY ./script.sh /tmp
ENV TZ=Asia/Seoul
RUN apk --no-cache add tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone \
    apk del tzdata

CMD ["sh", "/tmp/script.sh"]
