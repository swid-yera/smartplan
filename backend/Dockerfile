FROM golang:1.25 AS build

WORKDIR /app
COPY . .
RUN go mod tidy
RUN go build -o api ./cmd/api

FROM debian:latest
WORKDIR /root/
COPY --from=build /app/api .
COPY internal/db/migrations ./internal/db/migrations
EXPOSE 8080
CMD ["./api"]
