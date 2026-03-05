import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { execSync } from 'child_process';

const program = new Command();

function getProjectRoot() {
  let dir = process.cwd();
  while (dir !== '/') {
    if (fs.existsSync(path.join(dir, '.xtask'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('Not in an xtask project');
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

program
  .name('xtask worktree')
  .description('管理 worktree');

program
  .command('create <branch>')
  .option('--path <path>', 'Worktree 路径')
  .option('--agent <identity>', '代理身份', 'claude-opus-4')
  .option('--model <model>', '模型', 'claude-opus-4-6')
  .action((branch, options) => {
    const projectRoot = getProjectRoot();
    const worktreePath = options.path || process.cwd();

    const worktreesDir = path.join(projectRoot, '.xtask', 'worktrees');
    if (!fs.existsSync(worktreesDir)) {
      fs.mkdirSync(worktreesDir, { recursive: true });
    }

    const branchDir = path.join(projectRoot, '.xtask', 'branches', branch);
    if (!fs.existsSync(branchDir)) {
      fs.mkdirSync(branchDir, { recursive: true });
    }

    const worktree = {
      branch,
      worktree_path: worktreePath,
      created_at: new Date().toISOString(),
      agent: {
        identity: options.agent,
        model: options.model
      },
      status: 'active',
      tasks: [],
      last_commit: null
    };

    fs.writeFileSync(
      path.join(worktreesDir, `${branch}.yaml`),
      yaml.dump(worktree)
    );

    console.log(`✓ Worktree created: ${branch}`);
  });

program
  .command('list')
  .action(() => {
    const projectRoot = getProjectRoot();
    const worktreesDir = path.join(projectRoot, '.xtask', 'worktrees');

    if (!fs.existsSync(worktreesDir)) {
      console.log('No worktrees found');
      return;
    }

    const files = fs.readdirSync(worktreesDir).filter(f => f.endsWith('.yaml'));
    files.forEach(file => {
      const worktree = yaml.load(fs.readFileSync(path.join(worktreesDir, file), 'utf-8'));
      console.log(`${worktree.branch} (${worktree.status}) - ${worktree.tasks.length} tasks`);
    });
  });

program
  .command('info <branch>')
  .action((branch) => {
    const projectRoot = getProjectRoot();
    const file = path.join(projectRoot, '.xtask', 'worktrees', `${branch}.yaml`);

    if (!fs.existsSync(file)) {
      console.error(`Worktree not found: ${branch}`);
      process.exit(1);
    }

    const worktree = yaml.load(fs.readFileSync(file, 'utf-8'));
    console.log(yaml.dump(worktree));
  });

program
  .command('delete <branch>')
  .action((branch) => {
    const projectRoot = getProjectRoot();
    const file = path.join(projectRoot, '.xtask', 'worktrees', `${branch}.yaml`);

    if (!fs.existsSync(file)) {
      console.error(`Worktree not found: ${branch}`);
      process.exit(1);
    }

    fs.unlinkSync(file);
    console.log(`✓ Worktree deleted: ${branch}`);
  });

export default program;
