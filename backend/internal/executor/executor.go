package executor

import (
	"context"
	"os/exec"

	"go.uber.org/zap"
)

type Executor struct {
	logger *zap.Logger
}

func New(logger *zap.Logger) *Executor {
	return &Executor{logger: logger}
}

func (e *Executor) Run(ctx context.Context, name string, args ...string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, name, args...)
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	e.logger.Info("command executed",
		zap.String("command", name),
		zap.Strings("args", args),
		zap.ByteString("result", out),
	)

	return out, nil
}
