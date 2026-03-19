package handlers

import (
	"errors"
	"io"
	"net/http"

	"github.com/Gunter-Q12/lns/backend/internal/executor"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func Map(r *gin.Engine, h *Handlers) {
	r.GET("/api/*", h.Get)
}

type Handlers struct {
	logger *zap.Logger
	exe    *executor.Executor
}

func New(exe *executor.Executor, logger *zap.Logger) *Handlers {
	return &Handlers{exe: exe, logger: logger}
}

func (h *Handlers) Get(c *gin.Context) {
	var info io.Reader
	var err error
	switch c.Request.URL.Path {
	case "/api/nft":
		info, err = h.exe.Run(c.Request.Context(), "nft", "--json", "list", "ruleset")
	case "api/route":
		info, err = h.exe.Run(c.Request.Context(), "ip", "--json", "route", "show", "table", "all")
	case "api/addr":
		info, err = h.exe.Run(c.Request.Context(), "ip", "--json", "addr")
	default:
		err = errors.New("Incorrect path")
	}

	if err != nil {
		h.logger.Info("getting nft data", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"errors": err.Error()})
		return
	}

	c.JSON(http.StatusOK, info)
}
