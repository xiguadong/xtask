package service

import (
	"crypto/rand"
	"encoding/hex"
)

func BuildID(prefix string) string {
	buf := make([]byte, 6)
	_, _ = rand.Read(buf)
	return prefix + "-" + hex.EncodeToString(buf)
}

func withDefaultActor(actor string) string {
	if actor == "" {
		return "user"
	}
	return actor
}
