package helpers

import (
	"context"
	"fmt"

	"eduplan/backend/config"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPostgresDB(cfg *config.DBConfig) (*pgxpool.Pool, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)

	poolCfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("pgxpool.ParseConfig: %w", err)
	}

	poolCfg.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
		if err := registerEnumType(ctx, conn, "permission_code"); err != nil {
			return err
		}
		return nil
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), poolCfg)
	if err != nil {
		return nil, fmt.Errorf("pgxpool.NewWithConfig: %w", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		return nil, fmt.Errorf("db ping: %w", err)
	}

	return pool, nil
}

func registerEnumType(ctx context.Context, conn *pgx.Conn, typeName string) error {
	typ, err := conn.LoadType(ctx, typeName)
	if err != nil {
		return fmt.Errorf("load postgres type %s: %w", typeName, err)
	}
	conn.TypeMap().RegisterType(typ)

	arrayTypeName := "_" + typeName
	arrayTyp, err := conn.LoadType(ctx, arrayTypeName)
	if err != nil {
		return fmt.Errorf("load postgres type %s: %w", arrayTypeName, err)
	}
	conn.TypeMap().RegisterType(arrayTyp)

	return nil
}
