FROM postgres:alpine

ADD ./postgresql-init-files/postgresql.sh /docker-entrypoint-initdb.d/

EXPOSE 5432

CMD ["postgres"]
