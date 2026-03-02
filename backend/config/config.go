package config

import (
	"os"
	"path/filepath"
)

type Config struct {
	Port         string
	RegistryPath string
}

func Load() Config {
	home, _ := os.UserHomeDir()
	registry := filepath.Join(home, ".xtask", "projects.json")
	if v := os.Getenv("XTASK_REGISTRY"); v != "" {
		registry = v
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return Config{
		Port:         port,
		RegistryPath: registry,
	}
}
