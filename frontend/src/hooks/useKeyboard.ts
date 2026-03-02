import { useEffect } from 'react';

interface KeyboardOptions {
  onNewTask?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
}

export function useKeyboard({ onNewTask, onSearch, onEscape }: KeyboardOptions) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        onNewTask?.();
      }
      if (event.key === '/') {
        event.preventDefault();
        onSearch?.();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape?.();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onEscape, onNewTask, onSearch]);
}
