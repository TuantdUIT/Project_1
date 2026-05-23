import { type CSSProperties, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { CalendarDays, CalendarRange, ClipboardList, DoorOpen, GraduationCap, GripVertical, Layers, LayoutDashboard, ReceiptText, School, Users } from 'lucide-react';
import { paths } from '@/config/paths';

const minSidebarWidth = 104;
const defaultSidebarWidth = 240;
const maxSidebarWidth = 360;
const contentGap = 32;

function clampSidebarWidth(value: number) {
  return Math.min(Math.max(value, minSidebarWidth), maxSidebarWidth);
}

export default function AdminPortalRoute() {
  const [sidebarWidth, setSidebarWidth] = useState(defaultSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function handleMouseMove(event: MouseEvent) {
      setSidebarWidth(clampSidebarWidth(event.clientX));
    }

    function handleMouseUp() {
      setIsResizing(false);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const isCompact = sidebarWidth < 176;
  const isWide = sidebarWidth >= 288;
  const usersLabel = isWide ? 'Quản lý nhân sự' : 'Nhân sự';
  const registrationsLabel = isWide ? 'Học sinh đăng ký' : 'Đăng ký';
  const classesLabel = isWide ? 'Lớp học (đang học)' : 'Lớp học';
  const periodSettingsLabel = isWide ? 'Mẫu khóa học' : 'Template Period';
  const timetableLabel = isWide ? 'Thời Khóa Biểu' : 'Timetable';
  const studyWeeksLabel = isWide ? 'Tuần học (vận hành)' : 'Tuần học';
  const costsLabel = 'Chi phí';
  const headerTitle = location.pathname.startsWith(paths.adminPortalOverview)
    ? 'Tổng quan'
    : location.pathname.startsWith(paths.adminPortalUsers)
      ? 'Quản lý nhân sự'
      : location.pathname.startsWith(paths.adminPortalPeriodSettings)
        ? 'Mẫu khóa học'
        : location.pathname.startsWith(paths.adminPortalTimetable)
          ? 'Thời Khóa Biểu'
        : location.pathname.startsWith(paths.adminPortalCosts)
          ? 'Chi phí'
        : location.pathname.startsWith(paths.adminPortalStudyWeeks)
          ? 'Tuần học'
        : location.pathname.startsWith(paths.adminPortalClasses)
        ? 'Lớp học'
        : 'Học sinh đăng ký';
  const mainStyle = {
    '--admin-sidebar-width': `${sidebarWidth}px`,
    '--admin-content-gap': `${contentGap}px`,
  } as CSSProperties;

  function navItemClass(isActive: boolean) {
    return `flex h-12 w-full items-center rounded-xl text-[15px] font-semibold transition-colors ${
      isCompact ? 'justify-center px-0' : 'gap-3 px-4'
    } ${
      isActive
        ? 'bg-[#1870FF] text-white shadow-[0_14px_24px_rgba(24,112,255,0.24)]'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`;
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fb] font-sans text-slate-950">
      <aside
        className="fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-slate-200/80 bg-white lg:flex"
        style={{ width: sidebarWidth }}
      >
        <div className={`flex items-center py-5 ${isCompact ? 'justify-center px-3' : 'gap-3 px-5'}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1870FF] text-white shadow-[0_10px_22px_rgba(24,112,255,0.28)]">
            <GraduationCap size={22} />
          </div>
          {!isCompact ? (
            <div className="min-w-0">
              <h1 className="truncate text-[16px] font-extrabold leading-tight text-slate-950">BHP Math</h1>
              <p className="truncate text-[11px] font-medium leading-tight text-slate-500">Manager</p>
            </div>
          ) : null}
        </div>

        <nav className={`mt-7 flex-1 space-y-2 ${isCompact ? 'px-3' : 'px-3'}`}>
          <NavLink
            to={paths.adminPortalOverview}
            title={isCompact ? 'Tổng quan' : undefined}
            className={({ isActive }) => navItemClass(isActive)}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            {!isCompact ? <span className="truncate">Tổng quan</span> : null}
          </NavLink>
          <NavLink
            to={paths.adminPortalRegistrations}
            title={isCompact ? registrationsLabel : undefined}
            className={({ isActive }) => navItemClass(isActive)}
          >
            <ClipboardList size={18} className="shrink-0" />
            {!isCompact ? <span className="truncate">{registrationsLabel}</span> : null}
          </NavLink>
          <NavLink
            to={paths.adminPortalClasses}
            title={isCompact ? classesLabel : undefined}
            className={({ isActive }) => navItemClass(isActive)}
          >
            <School size={18} className="shrink-0" />
            {!isCompact ? <span className="truncate">{classesLabel}</span> : null}
          </NavLink>
          <NavLink
            to={paths.adminPortalUsers}
            title={isCompact ? usersLabel : undefined}
            className={({ isActive }) => navItemClass(isActive)}
          >
            <Users size={18} className="shrink-0" />
            {!isCompact ? <span className="truncate">{usersLabel}</span> : null}
          </NavLink>
          <NavLink
            to={paths.adminPortalPeriodSettings}
            title={isCompact ? periodSettingsLabel : undefined}
            className={({ isActive }) => navItemClass(isActive)}
          >
            <Layers size={18} className="shrink-0" />
            {!isCompact ? <span className="truncate">{periodSettingsLabel}</span> : null}
          </NavLink>
          <NavLink
            to={paths.adminPortalTimetable}
            title={isCompact ? timetableLabel : undefined}
            className={({ isActive }) => navItemClass(isActive)}
          >
            <CalendarRange size={18} className="shrink-0" />
            {!isCompact ? <span className="truncate">{timetableLabel}</span> : null}
          </NavLink>
          <NavLink
            to={paths.adminPortalStudyWeeks}
            title={isCompact ? studyWeeksLabel : undefined}
            className={({ isActive }) => navItemClass(isActive)}
          >
            <CalendarDays size={18} className="shrink-0" />
            {!isCompact ? <span className="truncate">{studyWeeksLabel}</span> : null}
          </NavLink>
          <NavLink
            to={paths.adminPortalCosts}
            title={isCompact ? costsLabel : undefined}
            className={({ isActive }) => navItemClass(isActive)}
          >
            <ReceiptText size={18} className="shrink-0" />
            {!isCompact ? <span className="truncate">{costsLabel}</span> : null}
          </NavLink>
        </nav>

        <div className={`mb-5 mt-4 border-t border-slate-200/80 pt-4 ${isCompact ? 'px-3' : 'px-3'}`}>
          <Link
            to={paths.home}
            title={isCompact ? 'Trở về Trang chủ' : undefined}
            className={`group flex h-12 w-full items-center rounded-xl text-[15px] font-semibold text-slate-600 transition-colors hover:bg-[#1870FF]/10 hover:text-[#1870FF] ${
              isCompact ? 'justify-center px-0' : 'gap-3 px-4'
            }`}
          >
            <DoorOpen
              size={20}
              className="shrink-0 transition-transform group-hover:-translate-x-0.5"
            />
            {!isCompact ? <span className="truncate">Trở về Trang chủ</span> : null}
          </Link>
        </div>

        <button
          type="button"
          aria-label="Kéo để thay đổi chiều rộng • Double-click để đặt lại"
          title="Kéo để thay đổi chiều rộng • Double-click để đặt lại"
          aria-orientation="vertical"
          onMouseDown={(event) => {
            event.preventDefault();
            setIsResizing(true);
          }}
          onDoubleClick={() => setSidebarWidth(defaultSidebarWidth)}
          className={`group absolute right-[-8px] top-0 z-30 flex h-full w-4 cursor-col-resize items-center justify-center transition ${
            isResizing ? 'bg-[rgba(24,112,255,0.12)]' : 'bg-transparent hover:bg-[rgba(24,112,255,0.08)]'
          }`}
        >
          <span
            aria-hidden
            className={`absolute right-1/2 top-0 h-full w-px translate-x-1/2 transition ${
              isResizing ? 'bg-[#1870FF]' : 'bg-slate-200 group-hover:bg-[#1870FF]/60'
            }`}
          />
          <span
            className={`relative flex h-14 w-[14px] items-center justify-center rounded-full border shadow-sm transition-all ${
              isResizing
                ? 'scale-110 border-[#1870FF] bg-[#1870FF] text-white shadow-[0_8px_20px_rgba(24,112,255,0.35)]'
                : 'border-slate-200 bg-white text-slate-400 shadow-[0_4px_10px_rgba(15,23,42,0.08)] group-hover:scale-105 group-hover:border-[#1870FF] group-hover:text-[#1870FF]'
            }`}
          >
            <GripVertical size={12} strokeWidth={2.5} />
          </span>
        </button>
      </aside>

      <main
        className="min-w-0 flex-1 overflow-y-auto lg:pl-[calc(var(--admin-sidebar-width)+var(--admin-content-gap))]"
        style={mainStyle}
      >
        <header className="px-5 pb-6 pt-6 sm:px-8 lg:pl-0 lg:pr-10">
          <div className="mx-auto max-w-7xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Admin Portal</p>
            <h1 className="text-[26px] font-extrabold leading-tight tracking-normal text-slate-950">
              {headerTitle}
            </h1>
          </div>
        </header>

        <div className="px-5 pb-10 sm:px-8 lg:pl-0 lg:pr-10">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
