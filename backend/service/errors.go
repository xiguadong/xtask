package service

import "errors"

var (
	ErrNotFound          = errors.New("not found")
	ErrInvalidInput      = errors.New("invalid input")
	ErrBlockedConstraint = errors.New("blocked constraint")
	ErrCycleDetected     = errors.New("cycle detected")
	ErrDuplicateParent   = errors.New("duplicate parent")
)
