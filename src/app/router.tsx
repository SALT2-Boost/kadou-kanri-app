import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../shared/ui/Layout';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';
import { SchedulePage } from '@/features/schedule';

// 初回ロード以外のページを遅延読み込み
const MemberList = lazy(() => import('@/features/members/components/MemberList'));
const MemberDetail = lazy(() => import('@/features/members/components/MemberDetail'));
const ProjectList = lazy(() => import('@/features/projects/components/ProjectList'));
const ProjectDetail = lazy(() => import('@/features/projects/components/ProjectDetail'));
const DashboardPage = lazy(() => import('@/features/dashboard/components/DashboardPage'));
const ExportPage = lazy(() => import('@/features/export/components/ExportPage'));
const MasterSettingsPage = lazy(() => import('@/features/settings/components/MasterSettingsPage'));

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<SchedulePage />} />
        <Route
          path="/projects"
          element={
            <Suspense fallback={<LoadingOverlay />}>
              <ProjectList />
            </Suspense>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <Suspense fallback={<LoadingOverlay />}>
              <ProjectDetail />
            </Suspense>
          }
        />
        <Route
          path="/members"
          element={
            <Suspense fallback={<LoadingOverlay />}>
              <MemberList />
            </Suspense>
          }
        />
        <Route
          path="/members/:id"
          element={
            <Suspense fallback={<LoadingOverlay />}>
              <MemberDetail />
            </Suspense>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<LoadingOverlay />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/export"
          element={
            <Suspense fallback={<LoadingOverlay />}>
              <ExportPage />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<LoadingOverlay />}>
              <MasterSettingsPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
