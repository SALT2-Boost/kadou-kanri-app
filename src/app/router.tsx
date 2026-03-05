import { Routes, Route } from 'react-router-dom';
import Layout from '../shared/ui/Layout';
import { MemberList, MemberDetail } from '@/features/members';
import { ProjectList, ProjectDetail } from '@/features/projects';
import { SchedulePage } from '@/features/schedule';
import { ExportPage } from '@/features/export';
import { DashboardPage } from '@/features/dashboard';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<SchedulePage />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/members" element={<MemberList />} />
        <Route path="/members/:id" element={<MemberDetail />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/export" element={<ExportPage />} />
      </Route>
    </Routes>
  );
}
