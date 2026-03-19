package executor

import (
	"context"
	"io"
	"os/exec"

	"go.uber.org/zap"
)

type Executor struct {
	logger *zap.Logger
}

func New(logger *zap.Logger) *Executor {
	return &Executor{logger: logger}
}

func (e *Executor) Run(ctx context.Context, name string, args ...string) (io.Reader, error) {
	cmd := exec.CommandContext(ctx, name, args...)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		e.logger.Fatal("running command", zap.Error(err))
	}
	if err := cmd.Start(); err != nil {
		e.logger.Fatal("command execution failed", zap.Error(err))
	}
	if err := cmd.Wait(); err != nil {
		e.logger.Fatal("failed to end command", zap.Error(err))
	}
	return stdout, nil
}
