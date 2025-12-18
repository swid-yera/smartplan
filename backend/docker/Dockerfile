FROM golang:1.25 AS build

WORKDIR /app
COPY . .
RUN go mod tidy
RUN go build -o api ./cmd/api

FROM debian:latest
RUN apt-get update && apt-get install -y postgresql-client
WORKDIR /root/
COPY --from=build /app/api ./
COPY pkg/atlas/migrations ./pkg/atlas/migrations
RUN chmod +x ./entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["./entrypoint.sh"]
CMD ["./api"]