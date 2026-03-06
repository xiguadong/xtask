import { Command } from 'commander';
import path from 'path';
import yaml from 'js-yaml';
import { getRepoRoot } from '../utils/gitRepo.js';
import { listDir, readYaml as readGitYaml, writeFiles } from '../utils/gitDataStore.js';

const program = new Command();

function getProjectRoot() {
  return getRepoRoot();
}

program
  .name('worktree')
  .description('管理 worktree');

program
  .command('create <branch>')
  .option('--path <path>', 'Worktree 路径')
  .option('--agent <identity>', '代理身份', 'claude-opus-4')
  .option('--model <model>', '模型', 'claude-opus-4-6')
  .action((branch, options) => {
    const projectRoot = getProjectRoot();
    const worktreePath = options.path || process.cwd();
    const resolvedWorktreePath = path.isAbsolute(worktreePath)
      ? worktreePath
      : path.resolve(projectRoot, worktreePath);

    if (resolvedWorktreePath === '/tmp' || resolvedWorktreePath.startsWith('/tmp/')) {
      console.error('禁止使用 /tmp 作为 worktree 目录，请使用项目内的 cache/worktrees 等路径');
      process.exit(1);
    }

    const storedWorktreePath = (() => {
      const relative = path.relative(projectRoot, resolvedWorktreePath);
      if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
        return relative;
      }
      return resolvedWorktreePath;
    })();

    const worktree = {
      branch,
      worktree_path: storedWorktreePath,
      created_at: new Date().toISOString(),
      agent: {
        identity: options.agent,
        model: options.model
      },
      status: 'active',
      tasks: [],
      last_commit: null
    };
    writeFiles(projectRoot, [
      { path: `worktrees/${branch}.yaml`, content: yaml.dump(worktree) }
    ], 'xtask create worktree');

    console.log(`✓ Worktree created: ${branch}`);
  });

program
  .command('list')
  .action(() => {
    const projectRoot = getProjectRoot();
    const files = listDir(projectRoot, 'worktrees').filter(f => f.endsWith('.yaml'));
    if (files.length === 0) {
      console.log('No worktrees found');
      return;
    }
    files.forEach(file => {
      const worktree = readGitYaml(projectRoot, `worktrees/${file}`);
      console.log(`${worktree.branch} (${worktree.status}) - ${worktree.tasks.length} tasks`);
    });
  });

program
  .command('info <branch>')
  .action((branch) => {
    const projectRoot = getProjectRoot();
    const worktree = readGitYaml(projectRoot, `worktrees/${branch}.yaml`);
    if (!worktree) {
      console.error(`Worktree not found: ${branch}`);
      process.exit(1);
    }

    console.log(yaml.dump(worktree));
  });

program
  .command('delete <branch>')
  .action((branch) => {
    const projectRoot = getProjectRoot();
    const worktree = readGitYaml(projectRoot, `worktrees/${branch}.yaml`);
    if (!worktree) {
      console.error(`Worktree not found: ${branch}`);
      process.exit(1);
    }

    writeFiles(projectRoot, [
      { path: `worktrees/${branch}.yaml`, delete: true }
    ], 'xtask delete worktree');
    console.log(`✓ Worktree deleted: ${branch}`);
  });

program
  .command('rename <oldBranch> <newBranch>')
  .action((oldBranch, newBranch) => {
    const projectRoot = getProjectRoot();
    const worktree = readGitYaml(projectRoot, `worktrees/${oldBranch}.yaml`);
    if (!worktree) {
      console.error(`Worktree not found: ${oldBranch}`);
      process.exit(1);
    }
    const existing = readGitYaml(projectRoot, `worktrees/${newBranch}.yaml`);
    if (existing) {
      console.error(`Target worktree already exists: ${newBranch}`);
      process.exit(1);
    }

    worktree.branch = newBranch;
    const changes = [
      { path: `worktrees/${newBranch}.yaml`, content: yaml.dump(worktree) },
      { path: `worktrees/${oldBranch}.yaml`, delete: true }
    ];
    const branchFiles = listDir(projectRoot, `branches/${oldBranch}`).filter(f => f.endsWith('.yaml'));
    branchFiles.forEach((file) => {
      const task = readGitYaml(projectRoot, `branches/${oldBranch}/${file}`);
      if (!task) return;
      task.git = task.git || {};
      task.git.branch = newBranch;
      changes.push({
        path: `branches/${newBranch}/${file}`,
        content: yaml.dump(task)
      });
      changes.push({
        path: `branches/${oldBranch}/${file}`,
        delete: true
      });
    });
    writeFiles(projectRoot, changes, 'xtask rename worktree');

    console.log(`✓ Worktree renamed: ${oldBranch} → ${newBranch}`);
  });

export default program;
