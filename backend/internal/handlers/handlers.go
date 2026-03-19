package handlers

import (
	"net/http"

	"github.com/Gunter-Q12/lns/backend/internal/executor"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func Map(r *gin.Engine, h *Handlers) {
	r.GET("/api/*path", h.Get)
}

type Handlers struct {
	logger *zap.Logger
	exe    *executor.Executor
}

func New(exe *executor.Executor, logger *zap.Logger) *Handlers {
	return &Handlers{exe: exe, logger: logger}
}

func (h *Handlers) Get(c *gin.Context) {
	var cmd string
	var args []string
	switch c.Param("path") {
	case "/nft":
		cmd = "nft"
		args = []string{"--json", "list", "ruleset"}
	case "/route":
		cmd = "ip"
		args = []string{"--json", "route", "show", "table", "all"}
	case "/addr":
		cmd = "ip"
		args = []string{"--json", "addr"}
	default:
		c.String(http.StatusNotFound, "Available paths: /api/nft, /api/route, /api/addr. Received path: %s", c.Request.URL.Path)
		return
	}

	info, err := h.exe.Run(c.Request.Context(), cmd, args...)
	if err != nil {
		h.logger.Error("getting data", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"errors": err.Error()})
		return
	}

	c.Data(http.StatusOK, "application/json", []byte(info))
}
