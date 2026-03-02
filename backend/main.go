package main

import (
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"xtask/backend/config"
	"xtask/backend/handler"
	"xtask/backend/service"
	"xtask/backend/store"
)

func main() {
	cfg := config.Load()
	yamlStore := store.NewYAMLStore()
	registry := store.NewProjectRegistry(cfg.RegistryPath, yamlStore)
	if err := registry.MigrateLegacyAgentsToXTask(); err != nil {
		log.Printf("legacy migration warning: %v", err)
	}
	ensureBootstrapProject(registry)

	taskSvc := service.NewTaskService(registry)
	graphSvc := service.NewGraphService(registry)
	milestoneSvc := service.NewMilestoneService(registry)
	historySvc := service.NewHistoryService(registry)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(handler.WithCORS)

	r.Get("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	r.Route("/api", func(api chi.Router) {
		handler.NewProjectHandler(registry).Mount(api)
		handler.NewTaskHandler(taskSvc).Mount(api)
		handler.NewMilestoneHandler(milestoneSvc).Mount(api)
		handler.NewRelationHandler(graphSvc).Mount(api)
		handler.NewHistoryHandler(historySvc).Mount(api)
	})

	mountFrontend(r)

	addr := ":" + cfg.Port
	log.Printf("xtask server listening on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal(err)
	}
}

func mountFrontend(r chi.Router) {
	sub, err := fs.Sub(frontendDist, "frontend_dist")
	if err != nil {
		log.Printf("embed fs unavailable: %v", err)
		return
	}
	static := http.FileServer(http.FS(sub))
	r.NotFound(func(w http.ResponseWriter, req *http.Request) {
		if req.URL.Path == "/" {
			serveIndex(w, sub)
			return
		}
		if _, err := fs.Stat(sub, req.URL.Path[1:]); err == nil {
			static.ServeHTTP(w, req)
			return
		}
		serveIndex(w, sub)
	})
	r.Handle("/*", static)
}

func serveIndex(w http.ResponseWriter, sub fs.FS) {
	raw, err := fs.ReadFile(sub, "index.html")
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte("index not found"))
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(raw)
}

func ensureBootstrapProject(registry *store.ProjectRegistry) {
	resp, err := registry.ListSummaries()
	if err == nil && len(resp.Projects) > 0 {
		return
	}
	cwd, err := os.Getwd()
	if err != nil {
		return
	}
	projectDir := filepath.Dir(cwd)
	if err := registry.AddPath(projectDir); err != nil {
		fmt.Printf("bootstrap add project failed: %v\n", err)
	}
}
