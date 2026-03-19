package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Gunter-Q12/lns/backend/internal/executor"
	"github.com/Gunter-Q12/lns/backend/internal/handlers"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

const (
	shutdownTimeout   = time.Second * 5
	readTimeout       = time.Second * 10
	readHeaderTimeout = time.Second * 5
)

func main() {
	mode := os.Getenv("MODE")
	logger, err := createLogger(mode)
	if err != nil {
		panic(err)
	}
	defer logger.Sync() //nolint:errcheck // cannot log if log does not work

	address := os.Getenv("ADDRESS")
	srv := newServer(mode, address, logger)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server failed", zap.Error(err))
		}
	}()
	logger.Info("server started", zap.String("address", address))

	<-ctx.Done()
	stop()
	logger.Info("shutting down gracefully, press Ctrl+C again to force")

	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("server failed to shutdown", zap.Error(err))
	}
}

func newServer(mode, address string, logger *zap.Logger) *http.Server {
	gin.SetMode(mode)
	router := gin.Default()
	exe := executor.New(logger)
	h := handlers.New(exe, logger)
	handlers.Map(router, h)

	srv := &http.Server{
		Addr:              address,
		Handler:           router,
		ReadTimeout:       readTimeout,
		ReadHeaderTimeout: readHeaderTimeout,
	}
	return srv
}

func createLogger(mode string) (*zap.Logger, error) {
	var logger *zap.Logger
	var err error
	switch mode {
	case "release":
		logger, err = zap.NewProduction()
	case "debug":
		logger, err = zap.NewDevelopment()
	default:
		err = fmt.Errorf("unexpected mode: %s", mode)
	}
	if err != nil {
		return nil, fmt.Errorf("creating logger: %w", err)
	}
	return logger, nil
}
