package main

import "embed"

//go:embed all:frontend_dist
var frontendDist embed.FS
