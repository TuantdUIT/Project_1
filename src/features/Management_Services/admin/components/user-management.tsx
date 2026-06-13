import { useEffect, useMemo, useState } from 'react';
import { Filter, Plus, Search, Users } from 'lucide-react';
import {
  useUsersQuery,
  type ResUserDTO,
  type StaffRoleName,
} from '@/features/Management_Services/admin';
import UserCreateModal from '@/features/Management_Services/admin/components/user-create-modal';
import UserDetailModal from '@/features/Management_Services/admin/components/user-detail-modal';
import { buildStaffRoleOptions, isStaffUser } from '@/features/Management_Services/admin/helper/roles';
import { useAuth } from '@/lib/auth/auth-context';
import { filterAssignableRoles } from '@/lib/auth/permissions';
import { formatDate } from '@/utils/date';

const cardClass = 'rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_36px_rgba(15,23,42,0.24)]';
const fieldClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';
const selectClass =
  'h-11 rounded-xl border border-slate-300 bg-white px-3 text-[14px] font-extrabold text-slate-950 outline-none transition focus:border-[#1870FF] focus:ring-4 focus:ring-[rgba(24,112,255,0.14)]';
const pageSize = 10;

export default function UserManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRoleName | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailTarget, setDetailTarget] = useState<ResUserDTO | null>(null);

  const usersQuery = useUsersQuery({ page: 1, size: 1000, sort: 'createdAt,desc' });

  const { role } = useAuth();
  const allUsers = usersQuery.data?.result ?? [];
  const staffUsers = useMemo(() => allUsers.filter(isStaffUser), [allUsers]);
  const roleOptions = useMemo(() => buildStaffRoleOptions(), []);
  // Vai trò mà người dùng hiện tại được phép gán (hiện không giới hạn).
  const assignableRoleOptions = useMemo(
    () => filterAssignableRoles(roleOptions, role?.roleName),
    [roleOptions, role?.roleName],
  );

  const normalizedSearch = search.trim().toLowerCase();
  const filteredStaffUsers = staffUsers.filter((user) => {
    const roleName = user.role?.name;
    const matchesRole = !roleFilter || roleName === roleFilter;
    const matchesSearch = !normalizedSearch || [
      user.user_fullname,
      user.user_email,
      user.user_phone_number,
      roleName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);

    return matchesRole && matchesSearch;
  });
  const totalStaffItems = filteredStaffUsers.length;
  const totalPages = Math.max(Math.ceil(totalStaffItems / pageSize), 1);
  const users = filteredStaffUsers.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(24,112,255,0.1)] text-[#1870FF]">
              <Users size={19} strokeWidth={2.6} />
            </span>
            <div>
              <h2 className="text-[18px] font-extrabold leading-tight text-slate-950">Quản lý nhân sự</h2>
              <p className="mt-1 text-[13px] font-semibold text-slate-500">
                Tài khoản TEACHER, MANAGER, TA và COLAB_TEACHER
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex h-11 w-fit items-center gap-2 rounded-xl bg-[#1870FF] px-5 text-[14px] font-extrabold text-white shadow-[0_12px_22px_rgba(24,112,255,0.26)] transition hover:bg-[#0f62e6]"
          >
            <Plus size={17} />
            Tạo nhân sự mới
          </button>
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={Filter} title="Bộ lọc" />
        <div className="border-t border-slate-100 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:max-w-4xl">
            <label className="space-y-2">
              <span className="text-[13px] font-bold text-slate-600">Tìm theo tên / email / SĐT</span>
              <div className="relative">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nhập từ khóa..."
                  className={`${fieldClass} pl-10`}
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-[13px] font-bold text-slate-600">Vai trò</span>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as StaffRoleName | '')}
                className={`${selectClass} w-full`}
              >
                <option value="">Tất cả</option>
                {roleOptions.map((role) => (
                  <option key={`${role.name}-${role.id}`} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader icon={Users} title="Danh sách nhân sự" trailing={`${totalStaffItems} nhân sự`} />
        <div className="border-t border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-slate-50/80 text-[12px] font-extrabold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Họ tên</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">SĐT</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setDetailTarget(user)}
                    className="h-[76px] cursor-pointer transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <p className="text-[16px] font-extrabold text-slate-950">{user.user_fullname ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-slate-900">{user.user_email ?? '—'}</td>
                    <td className="px-6 py-4 text-[14px] font-medium text-slate-900">{user.user_phone_number ?? '—'}</td>
                    <td className="px-6 py-4">
                      <RolePill name={user.role?.name} />
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium text-slate-900">{formatDate(user.created_at)}</td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[14px] font-semibold text-slate-500">
                      {usersQuery.isLoading
                        ? 'Đang tải danh sách nhân sự...'
                        : normalizedSearch || roleFilter
                          ? 'Không tìm thấy nhân sự khớp bộ lọc.'
                          : 'Chưa có nhân sự nào.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[14px] font-extrabold text-slate-500">
              Trang {page}/{totalPages} · {totalStaffItems} nhân sự
            </p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page <= 1}
                className="text-[14px] font-extrabold text-slate-950 transition hover:text-[#1870FF] disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={page >= totalPages}
                className="text-[14px] font-extrabold text-slate-950 transition hover:text-[#1870FF] disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </section>

      {showCreateModal ? (
        <UserCreateModal roleOptions={assignableRoleOptions} onClose={() => setShowCreateModal(false)} />
      ) : null}

      {detailTarget?.id ? (
        <UserDetailModal
          userUuid={detailTarget.id}
          fallback={detailTarget}
          roleOptions={assignableRoleOptions}
          onClose={() => setDetailTarget(null)}
        />
      ) : null}
    </div>
  );
}


function RolePill({ name }: { name?: string | null }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[12px] font-extrabold text-slate-700">
      {name ?? '—'}
    </span>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  trailing,
}: {
  icon: typeof Users;
  title: string;
  trailing?: string;
}) {
  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(24,112,255,0.1)] text-[#1870FF]">
          <Icon size={19} strokeWidth={2.6} />
        </span>
        <h2 className="text-[18px] font-extrabold leading-tight text-slate-950">{title}</h2>
      </div>
      {trailing ? (
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[12px] font-extrabold text-slate-600">
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

