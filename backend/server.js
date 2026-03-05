import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import projectsRouter from './src/routes/projects.js';
import tasksRouter from './src/routes/tasks.js';
import milestonesRouter from './src/routes/milestones.js';
import worktreesRouter from './src/routes/worktrees.js';
import branchesRouter from './src/routes/branches.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/projects', projectsRouter);
app.use('/api/projects', tasksRouter);
app.use('/api/projects', milestonesRouter);
app.use('/api/projects', worktreesRouter);
app.use('/api/projects', branchesRouter);

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
