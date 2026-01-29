package parser

type Hook int

const (
	HookFilter Hook = iota
)

type Family int

const (
	FamilyInet Family = iota
)

type Chain struct {
	Table    Table
	Hook     Hook
	Priority int
	Rules    []Rule
}

type Table struct {
	Name   string
	Family Family
}

type Rule struct {
	Match     Match
	Statement Statement
}

type Match struct {
	Op    string      `json:"op"`
	Left  *Payload    `json:"left"`
	Right interface{} `json:"right"`
}

type Statement struct {
}  *Payloadx``
