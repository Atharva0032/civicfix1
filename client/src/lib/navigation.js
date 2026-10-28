import {
  BarChart3,
  Bell,
  Building2,
  Compass,
  FileText,
  LayoutDashboard,
  MapPinned,
  PlusCircle,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';

/** Sidebar navigation for signed-in citizens. */
export const citizenNav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/reports', label: 'My Reports', icon: FileText },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell, badge: 'unread' },
  { to: '/report', label: 'Report an Issue', icon: PlusCircle, accent: true },
  { to: '/explore', label: 'Explore Issues', icon: Compass },
  { to: '/map', label: 'Issue Map', icon: MapPinned },
  { to: '/dashboard/profile', label: 'Profile', icon: Settings },
];

/** Sidebar navigation for municipal administrators. */
export const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/issues', label: 'Complaints', icon: FileText },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/citizens', label: 'Citizens', icon: Users },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell, badge: 'unread' },
  { to: '/map', label: 'City Map', icon: MapPinned },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

/** Public site navigation. */
export const publicNav = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore Issues' },
  { to: '/map', label: 'Issue Map' },
  { to: '/how-it-works', label: 'How It Works' },
];

export const ADMIN_BADGE = ShieldCheck;
export default { citizenNav, adminNav, publicNav };
