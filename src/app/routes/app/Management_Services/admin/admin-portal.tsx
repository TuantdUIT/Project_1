import { type CSSProperties, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { BookOpen, CalendarDays, CalendarRange, ChevronDown, ClipboardList, DoorOpen, FileText, GraduationCap, GripVertical, Layers, LayoutDashboard, Menu, ReceiptText, ScanLine, School, UserRoundCheck, Users, X } from 'lucide-react';
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
  const [isMsOpen, setIsMsOpen] = useState(true);
  const [isEsOpen, setIsEsOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Đóng drawer mobile mỗi khi điều hướng sang route khác.
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

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
  const headerTitle = location.pathname.startsWith(paths.adminPortalOverview)
    ? 'Tổng quan'
    : location.pathname.startsWith(paths.adminPortalUsers)
      ? 'Quản lý nhân sự'
      : location.pathname.startsWith(paths.adminPortalPeriodSettings)
        ? 'Mẫu khóa học'
        : location.pathname.startsWith(paths.adminPortalTimetable)
          ? 'Thời Khóa Biểu'
          : location.pathname.startsWith(paths.adminPortalLearningResources)
            ? 'Tài liệu học tập'
          : location.pathname.startsWith(paths.adminPortalRecordAttendances)
            ? 'Chấm công nhân sự'
          : location.pathname.startsWith(paths.adminPortalCosts)
            ? 'Chi phí'
            : location.pathname.startsWith(paths.adminPortalStudyWeeks)
              ? 'Tuần học'
              : location.pathname.startsWith(paths.adminPortalClasses)
                ? 'Lớp học'
                : location.pathname.includes('/exam/exams/') && location.pathname.endsWith('/edit')
                  ? 'Chỉnh sửa phòng thi'
                  : location.pathname.startsWith(paths.adminPortalExamCreate)
                  ? 'Tạo phòng thi mới'
                  : location.pathname.startsWith(paths.adminPortalExams)
                  ? 'Quản lý phòng thi'
                  : location.pathname.startsWith(paths.adminPortalOmr)
                    ? 'Chấm phiếu OMR'
                    : location.pathname.startsWith(paths.adminPortalExamQuestions)
                      ? 'Ngân hàng câu hỏi'
                      : 'Đăng ký';
  const mainStyle = {
    '--admin-sidebar-width': `${sidebarWidth}px`,
    '--admin-content-gap': `${contentGap}px`,
  } as CSSProperties;

  function renderSidebarLinks({
    compact,
    wide,
    onNavigate,
  }: {
    compact: boolean;
    wide: boolean;
    onNavigate?: () => void;
  }) {
    const usersLabel = wide ? 'Quản lý nhân sự' : 'Nhân sự';
    const registrationsLabel = wide ? 'Học sinh đăng ký' : 'Đăng ký';
    const classesLabel = wide ? 'Lớp học (đang học)' : 'Lớp học';
    const periodSettingsLabel = wide ? 'Mẫu khóa học' : 'Template Period';
    const timetableLabel = wide ? 'Thời Khóa Biểu' : 'Timetable';
    const studyWeeksLabel = wide ? 'Tuần học (vận hành)' : 'Tuần học';
    const learningResourcesLabel = wide ? 'Tài liệu học tập' : 'Học liệu';
    const costsLabel = 'Chi phí';
    const recordAttendancesLabel = wide ? 'Chấm công nhân sự' : 'Chấm công';

    function navItemClass(isActive: boolean) {
      return `flex h-12 w-full items-center rounded-xl text-[15px] font-semibold transition-colors ${
        compact ? 'justify-center px-0' : 'gap-3 px-4'
      } ${
        isActive
          ? 'bg-[#1870FF] text-white shadow-[0_14px_24px_rgba(24,112,255,0.24)]'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`;
    }

    return (
      <>
        {/* Management Services dropdown group */}
        <div>
          <button
            type="button"
            onClick={() => setIsMsOpen((v) => !v)}
            title={compact ? 'Management Services' : undefined}
            className={`flex w-full items-center rounded-xl text-[13px] font-black uppercase tracking-wider transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100 ${
              compact ? 'h-10 justify-center px-0' : 'h-9 gap-2 px-3'
            }`}
          >
            {!compact ? (
              <>
                <span className="truncate">Management Services</span>
                <ChevronDown
                  size={14}
                  className={`ml-auto shrink-0 transition-transform duration-200 ${isMsOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              </>
            ) : (
              <span className="font-black">MS</span>
            )}
          </button>

          {isMsOpen && (
            <div className={`mt-1 space-y-1 ${!compact ? 'border-l-2 border-slate-100 ml-3 pl-2' : ''}`}>
              <NavLink
                to={paths.adminPortalOverview}
                onClick={onNavigate}
                title={compact ? 'Tổng quan' : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <LayoutDashboard size={18} className="shrink-0" />
                {!compact ? <span className="truncate">Tổng quan</span> : null}
              </NavLink>
              <NavLink
                to={paths.adminPortalRegistrations}
                onClick={onNavigate}
                title={compact ? registrationsLabel : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <ClipboardList size={18} className="shrink-0" />
                {!compact ? <span className="truncate">{registrationsLabel}</span> : null}
              </NavLink>
              <NavLink
                to={paths.adminPortalClasses}
                onClick={onNavigate}
                title={compact ? classesLabel : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <School size={18} className="shrink-0" />
                {!compact ? <span className="truncate">{classesLabel}</span> : null}
              </NavLink>
              <NavLink
                to={paths.adminPortalUsers}
                onClick={onNavigate}
                title={compact ? usersLabel : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <Users size={18} className="shrink-0" />
                {!compact ? <span className="truncate">{usersLabel}</span> : null}
              </NavLink>
              <NavLink
                to={paths.adminPortalPeriodSettings}
                onClick={onNavigate}
                title={compact ? periodSettingsLabel : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <Layers size={18} className="shrink-0" />
                {!compact ? <span className="truncate">{periodSettingsLabel}</span> : null}
              </NavLink>
              <NavLink
                to={paths.adminPortalTimetable}
                onClick={onNavigate}
                title={compact ? timetableLabel : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <CalendarRange size={18} className="shrink-0" />
                {!compact ? <span className="truncate">{timetableLabel}</span> : null}
              </NavLink>
              <NavLink
                to={paths.adminPortalStudyWeeks}
                onClick={onNavigate}
                title={compact ? studyWeeksLabel : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <CalendarDays size={18} className="shrink-0" />
                {!compact ? <span className="truncate">{studyWeeksLabel}</span> : null}
              </NavLink>
              <NavLink
                to={paths.adminPortalRecordAttendances}
                onClick={onNavigate}
                title={compact ? recordAttendancesLabel : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <UserRoundCheck size={18} className="shrink-0" />
                {!compact ? <span className="truncate">{recordAttendancesLabel}</span> : null}
              </NavLink>
              <NavLink
                to={paths.adminPortalLearningResources}
                onClick={onNavigate}
                title={compact ? learningResourcesLabel : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <BookOpen size={18} className="shrink-0" />
                {!compact ? <span className="truncate">{learningResourcesLabel}</span> : null}
              </NavLink>
              <NavLink
                to={paths.adminPortalCosts}
                onClick={onNavigate}
                title={compact ? costsLabel : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <ReceiptText size={18} className="shrink-0" />
                {!compact ? <span className="truncate">{costsLabel}</span> : null}
              </NavLink>
            </div>
          )}
        </div>

        {/* Exam Services dropdown group */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setIsEsOpen((v) => !v)}
            title={compact ? 'Exam Services' : undefined}
            className={`flex w-full items-center rounded-xl text-[13px] font-black uppercase tracking-wider transition-colors text-slate-400 hover:text-slate-700 hover:bg-slate-100 ${
              compact ? 'h-10 justify-center px-0' : 'h-9 gap-2 px-3'
            }`}
          >
            {!compact ? (
              <>
                <span className="truncate">Exam Services</span>
                <ChevronDown
                  size={14}
                  className={`ml-auto shrink-0 transition-transform duration-200 ${isEsOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              </>
            ) : (
              <span className="font-black">ES</span>
            )}
          </button>

          {isEsOpen && (
            <div className={`mt-1 space-y-1 ${!compact ? 'border-l-2 border-slate-100 ml-3 pl-2' : ''}`}>
              <NavLink
                to={paths.adminPortalExamQuestions}
                onClick={onNavigate}
                title={compact ? 'Ngân hàng câu hỏi' : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <FileText size={18} className="shrink-0" />
                {!compact ? <span className="truncate">Ngân hàng câu hỏi</span> : null}
              </NavLink>
              <NavLink
                to={paths.adminPortalExams}
                onClick={onNavigate}
                title={compact ? 'Quản lý phòng thi' : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <DoorOpen size={18} className="shrink-0" />
                {!compact ? <span className="truncate">Quản lý phòng thi</span> : null}
              </NavLink>
              <NavLink
                to={paths.adminPortalOmr}
                onClick={onNavigate}
                title={compact ? 'Chấm phiếu OMR' : undefined}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <ScanLine size={18} className="shrink-0" />
                {!compact ? <span className="truncate">Chấm phiếu OMR</span> : null}
              </NavLink>
            </div>
          )}
        </div>
      </>
    );
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

        <nav className="mt-7 flex-1 overflow-y-auto px-3">
          {renderSidebarLinks({ compact: isCompact, wide: isWide })}
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

      {/* Drawer sidebar cho mobile/tablet (hiện khi màn hình thu nhỏ < lg) */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${isMobileSidebarOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!isMobileSidebarOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            isMobileSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileSidebarOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-white shadow-xl transition-transform duration-300 ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1870FF] text-white shadow-[0_10px_22px_rgba(24,112,255,0.28)]">
                <GraduationCap size={22} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[16px] font-extrabold leading-tight text-slate-950">BHP Math</h1>
                <p className="truncate text-[11px] font-medium leading-tight text-slate-500">Manager</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Đóng menu"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="mt-4 flex-1 overflow-y-auto px-3">
            {renderSidebarLinks({
              compact: false,
              wide: true,
              onNavigate: () => setIsMobileSidebarOpen(false),
            })}
          </nav>

          <div className="mb-5 mt-4 border-t border-slate-200/80 px-3 pt-4">
            <Link
              to={paths.home}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="group flex h-12 w-full items-center gap-3 rounded-xl px-4 text-[15px] font-semibold text-slate-600 transition-colors hover:bg-[#1870FF]/10 hover:text-[#1870FF]"
            >
              <DoorOpen
                size={20}
                className="shrink-0 transition-transform group-hover:-translate-x-0.5"
              />
              <span className="truncate">Trở về Trang chủ</span>
            </Link>
          </div>
        </aside>
      </div>

      <main
        className="min-w-0 flex-1 overflow-y-auto lg:pl-[calc(var(--admin-sidebar-width)+var(--admin-content-gap))]"
        style={mainStyle}
      >
        <header className="px-5 pb-6 pt-6 sm:px-8 lg:pl-0 lg:pr-10">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Mở menu"
              className="-ml-2 shrink-0 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            >
              <Menu size={24} />
            </button>
            <div className="min-w-0">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Admin Portal</p>
              <h1 className="text-[26px] font-extrabold leading-tight tracking-normal text-slate-950">
                {headerTitle}
              </h1>
            </div>
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
