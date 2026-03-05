import fs from 'fs';
import path from 'path';

export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

export function readDir(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath);
}

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
