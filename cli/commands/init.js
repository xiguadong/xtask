import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { getRepoRoot } from '../utils/gitRepo.js';
import { getRefCommit, writeFiles } from '../utils/gitDataStore.js';

const BUILTIN_SKILLS = ['xtask-safe', 'init-xtask'];

function getCliProjectRoot() {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), '..', '..');
}

function installBundledSkills(projectPath) {
  const cliProjectRoot = getCliProjectRoot();
  const sourceBase = path.join(cliProjectRoot, '.codex', 'skills');
  const targetBase = path.join(projectPath, '.codex', 'skills');
  const installed = [];
  const skipped = [];

  if (!fs.existsSync(sourceBase)) {
    return {
      installed,
      skipped: BUILTIN_SKILLS.map((name) => `${name}(缺少源目录)`)
    };
  }

  fs.mkdirSync(targetBase, { recursive: true });

  BUILTIN_SKILLS.forEach((name) => {
    const sourcePath = path.join(sourceBase, name);
    const targetPath = path.join(targetBase, name);

    if (!fs.existsSync(sourcePath)) {
      skipped.push(`${name}(缺少源目录)`);
      return;
    }

    if (path.resolve(sourcePath) === path.resolve(targetPath)) {
      skipped.push(`${name}(已在当前仓库)`);
      return;
    }

    try {
      fs.cpSync(sourcePath, targetPath, { recursive: true, force: true });
      installed.push(name);
    } catch (error) {
      skipped.push(`${name}(${error.message})`);
    }
  });

  return { installed, skipped };
}

export function initCommand() {
  const projectPath = getRepoRoot();
  const existing = getRefCommit(projectPath);

  if (!existing) {
    writeFiles(
      projectPath,
      [
        { path: 'config.yaml', content: yaml.dump({}) },
        { path: 'milestones.yaml', content: yaml.dump({ milestones: [] }) }
      ],
      'xtask init'
    );

    console.log('已初始化 xtask Git 数据分支');
  } else {
    console.log('xtask 数据已初始化');
  }

  const { installed, skipped } = installBundledSkills(projectPath);

  if (installed.length > 0) {
    console.log(`已安装项目内置 skills：${installed.join(', ')}`);
  }

  if (skipped.length > 0) {
    console.log(`已跳过 skills：${skipped.join(', ')}`);
  }
}
