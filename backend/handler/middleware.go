package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"xtask/backend/service"
	"xtask/backend/store"
)

type HandlerFunc func(w http.ResponseWriter, r *http.Request) error

type APIError struct {
	Error ErrorBody `json:"error"`
}

type ErrorBody struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

func JSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func Wrap(next HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := next(w, r); err != nil {
			writeError(w, err)
		}
	}
}

func WithCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeError(w http.ResponseWriter, err error) {
	status := http.StatusInternalServerError
	code := "INTERNAL_ERROR"
	message := err.Error()

	switch {
	case errors.Is(err, service.ErrInvalidInput):
		status = http.StatusBadRequest
		code = "INVALID_INPUT"
	case errors.Is(err, service.ErrNotFound):
		status = http.StatusNotFound
		code = "NOT_FOUND"
	case errors.Is(err, store.ErrProjectNotFound):
		status = http.StatusNotFound
		code = "NOT_FOUND"
	case errors.Is(err, service.ErrBlockedConstraint):
		status = http.StatusConflict
		code = "BLOCKED_CONSTRAINT"
	case errors.Is(err, service.ErrCycleDetected):
		status = http.StatusUnprocessableEntity
		code = "CYCLE_DETECTED"
	case errors.Is(err, service.ErrDuplicateParent):
		status = http.StatusUnprocessableEntity
		code = "DUPLICATE_PARENT"
	}

	if status >= 500 {
		log.Printf("internal error: %v", err)
	}
	JSON(w, status, APIError{Error: ErrorBody{Code: code, Message: message}})
}
