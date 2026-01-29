package parser_test

import (
	_ "embed"
	"testing"

	"github.com/stretchr/testify/assert"
	"gitlab.com/gunter-go/lns/internal/parser"
)

//go:embed testdata/empty.json
var empty string

//go:embed testdata/filter_drop.json
var filterDrop string

func TestParse(t *testing.T) {
	got := parser.Parse(empty)
	want := make([]parser.Chain, 0)
	assert.Equal(t, want, got)

	got = parser.Parse(filterDrop)
	want = []parser.Chain{
		{
			Table:    parser.Table{"Filter", parser.FamilyInet},
			Hook:     parser.HookFilter,
			Priority: 0,
			Rules: []parser.Rule {
				{

				}
			},
		},
	}
	assert.Equal(t, want, got)
}
