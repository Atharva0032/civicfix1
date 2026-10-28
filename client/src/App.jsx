import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/routing/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ExplorePage from './pages/ExplorePage';
import MapPage from './pages/MapPage';
import IssueDetailPage from './pages/IssueDetailPage';
import NotFoundPage from './pages/NotFoundPage';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import ReportIssuePage from './pages/ReportIssuePage';
import CitizenDashboardPage from './pages/dashboard/CitizenDashboardPage';
import MyReportsPage from './pages/dashboard/MyReportsPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import ProfilePage from './pages/dashboard/ProfilePage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminIssuesPage from './pages/admin/AdminIssuesPage';
import AdminDepartmentsPage from './pages/admin/AdminDepartmentsPage';
import AdminCitizensPage from './pages/admin/AdminCitizensPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';

/** Every navigation starts at the top of the new page. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ---- Public site ------------------------------------------------- */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/issues/:id" element={<IssueDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ---- Authentication -------------------------------------------- */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ---- Signed-in citizens (and officers filing complaints) -------- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/report" element={<ReportIssuePage />} />
            <Route path="/dashboard" element={<CitizenDashboardPage />} />
            <Route path="/dashboard/reports" element={<MyReportsPage />} />
            <Route path="/dashboard/notifications" element={<NotificationsPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* ---- Municipal administrators ---------------------------------- */}
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/issues" element={<AdminIssuesPage />} />
            <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
            <Route path="/admin/citizens" element={<AdminCitizensPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
