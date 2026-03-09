#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { registerProject, listProjects, deleteProject, deleteProjectByPath, migrateProjectToGit } from './commands/project.js';
import { createTask, listTasks, showTask, updateTask, deleteTask, assignAgent, mergeTask } from './commands/task.js';
import { createMilestone, listMilestones, updateMilestone } from './commands/milestone.js';
import { startServer } from './commands/start.js';
import worktreeCommand from './commands/worktree.js';

const program = new Command();

program
  .name('xtask')
  .description('Local project management system')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize xtask data in Git')
  .action(initCommand);

program
  .command('start')
  .description('Start web server')
  .option('-p, --port <port>', 'Server port')
  .action((options) => startServer(options));

const project = program.command('project').description('Manage projects');

project
  .command('register')
  .description('Register current project')
  .action(registerProject);

project
  .command('list')
  .description('List all projects')
  .action(listProjects);

project
  .command('delete <name>')
  .description('Delete project')
  .action(deleteProject);

project
  .command('delete-path <path>')
  .description('Delete project by path')
  .action(deleteProjectByPath);

project
  .command('migrate-to-git')
  .description('Migrate local .xtask data to Git data branch')
  .action(migrateProjectToGit);

const task = program.command('task').description('Manage tasks');

task
  .command('create <title>')
  .description('Create new task')
  .option('-m, --milestone <id>', 'Milestone ID')
  .option('-l, --labels <labels>', 'Comma-separated labels')
  .option('-p, --priority <priority>', 'Priority level')
  .option('-d, --description <desc>', 'Task description')
  .action((title, options) => createTask(title, options));

task
  .command('list')
  .description('List tasks')
  .option('-m, --milestone <id>', 'Filter by milestone')
  .option('-s, --status <status>', 'Filter by status')
  .option('-l, --label <label>', 'Filter by label')
  .action((options) => listTasks(options));

task
  .command('show <id>')
  .description('Show task details')
  .action(showTask);

task
  .command('update <id>')
  .description('Update task')
  .option('-s, --status <status>', 'Task status')
  .option('-p, --priority <priority>', 'Priority level')
  .option('-m, --milestone <id>', 'Milestone ID')
  .option('-l, --labels <labels>', 'Comma-separated labels')
  .option('--summary <summary>', 'Task summary content')
  .action((id, options) => updateTask(id, options));

task
  .command('delete <id>')
  .description('Delete task')
  .action((id) => deleteTask(id));

task
  .command('assign <id>')
  .description('Assign agent to task')
  .option('-a, --agent <agent>', 'Agent identity')
  .option('-b, --branch <branch>', 'Git branch')
  .action((id, options) => assignAgent(id, options));

task
  .command('merge <id>')
  .description('Merge task from branch')
  .option('-f, --from-branch <branch>', 'Source branch')
  .action((id, options) => mergeTask(id, options));

const milestone = program.command('milestone').description('Manage milestones');

milestone
  .command('create <name>')
  .description('Create milestone')
  .option('-d, --due <date>', 'Due date')
  .option('--description <desc>', 'Description')
  .action((name, options) => createMilestone(name, options));

milestone
  .command('list')
  .description('List milestones')
  .action(listMilestones);

milestone
  .command('update <id>')
  .description('Update milestone')
  .option('-n, --name <name>', 'Milestone name')
  .option('-s, --status <status>', 'Status')
  .option('-d, --due <date>', 'Due date')
  .action((id, options) => updateMilestone(id, options));

program.addCommand(worktreeCommand);

program.parse();
