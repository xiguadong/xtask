import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProjectListPage from './pages/ProjectListPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TaskDetailPage from './pages/TaskDetailPage';
import TodoDocsPage from './pages/TodoDocsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/projects/:projectName" element={<ProjectDetailPage />} />
        <Route path="/projects/:projectName/tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="/projects/:projectName/tasks/:taskId/todo-docs" element={<TodoDocsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
