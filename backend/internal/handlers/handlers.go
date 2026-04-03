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
	var nsCmd []string
	var cmd []string

	namespace := c.Query("namespace")
	if namespace != "" {
		nsCmd = []string{"netns", "--net=" + namespace}
	}

	switch c.Param("path") {
	case "/namespaces":
		cmd = []string{"lsns", "--json", "-t", "net"}
	case "/nft":
		cmd = []string{"nft", "--json", "list", "ruleset"}
	case "/route":
		cmd = []string{"ip", "--json", "route", "show", "table", "all"}
	case "/rule4":
		cmd = []string{"ip", "--json", "rule"}
	case "/rule6":
		cmd = []string{"ip", "-6", "--json", "rule"}
	case "/addr":
		cmd = []string{"ip", "--json", "addr"}
	default:
		c.String(http.StatusNotFound, "Received unknown path: %s", c.Request.URL.Path)
		return
	}

	finalCmd := append(nsCmd, cmd...)

	info, err := h.exe.Run(c.Request.Context(), finalCmd[0], finalCmd[1:]...)
	if err != nil {
		h.logger.Error("getting data", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"errors": err.Error()})
		return
	}

	c.Data(http.StatusOK, "application/json", info)
}
