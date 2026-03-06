import yaml from 'js-yaml';
import { getRepoRoot } from '../utils/gitRepo.js';
import { getRefCommit, writeFiles } from '../utils/gitDataStore.js';

export function initCommand() {
  const projectPath = getRepoRoot();
  const existing = getRefCommit(projectPath);
  if (existing) {
    console.log('xtask 数据已初始化');
    return;
  }

  writeFiles(
    projectPath,
    [
      { path: 'config.yaml', content: yaml.dump({}) },
      { path: 'milestones.yaml', content: yaml.dump({ milestones: [] }) }
    ],
    'xtask init'
  );

  console.log('已初始化 xtask Git 数据分支');
}
