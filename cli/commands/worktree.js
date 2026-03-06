import { Command } from 'commander';
import path from 'path';
import yaml from 'js-yaml';
import { getRepoRoot, getCurrentBranch } from '../utils/gitRepo.js';
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
  .command('tasks [branch]')
  .description('列出指定或当前分支/worktree 的任务')
  .option('-m, --milestone <id>', '按里程碑过滤')
  .option('-s, --status <status>', '按状态过滤')
  .option('-l, --label <label>', '按标签过滤')
  .action((branch, options) => {
    const projectRoot = getProjectRoot();
    const targetBranch = branch || getCurrentBranch(projectRoot);

    if (!targetBranch || targetBranch === 'HEAD') {
      console.error('无法获取当前分支，请先切换到一个分支后再试');
      process.exit(1);
    }

    const worktree = readGitYaml(projectRoot, `worktrees/${targetBranch}.yaml`);
    const worktreeTaskIds = Array.isArray(worktree?.tasks) ? worktree.tasks.filter(Boolean) : [];

    const branchFiles = listDir(projectRoot, `branches/${targetBranch}`).filter(f => f.endsWith('.yaml'));
    const branchTaskIds = branchFiles.map(f => f.replace(/\.yaml$/, ''));

    const orderedIds = [];
    const seen = new Set();
    const addId = (id) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      orderedIds.push(id);
    };

    worktreeTaskIds.forEach(addId);
    branchTaskIds.forEach(addId);

    const missing = [];
    let tasks = orderedIds
      .map((id) => {
        const task = readGitYaml(projectRoot, `branches/${targetBranch}/${id}.yaml`);
        if (!task) missing.push(id);
        return task;
      })
      .filter(Boolean);

    if (options.milestone) {
      tasks = tasks.filter(t => t.milestone_id === options.milestone);
    }
    if (options.status) {
      tasks = tasks.filter(t => t.status === options.status);
    }
    if (options.label) {
      tasks = tasks.filter(t => (t.labels || []).includes(options.label));
    }

    if (tasks.length === 0) {
      console.log('No tasks');
      if (missing.length > 0) {
        console.warn(`⚠️ 以下任务在数据分支中缺失：${missing.join(', ')}`);
      }
      return;
    }

    tasks.forEach(t => {
      console.log(`${t.id}: ${t.title} [${t.status}]${t.milestone_id ? ` - ${t.milestone_id}` : ''}`);
    });

    if (missing.length > 0) {
      console.warn(`⚠️ 以下任务在数据分支中缺失：${missing.join(', ')}`);
    }
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
