import PeriodSettingList from '@/features/Management_Services/period-setting/components/period-setting-list';
import TimetableTemplateManageList from '@/features/Management_Services/timetable-template/components/timetable-template-manage-list';
import RaTemplateManageList from '@/features/Management_Services/employee-ra-template/components/ra-template-manage-list';

/**
 * Ý nghĩa: Trang "Tổng hợp template" gom 3 nhóm template về một chỗ:
 * Mẫu khóa học (period setting), Mẫu thời khóa biểu (timetable template)
 * và Mẫu chấm công (employee RA template).
 */
export default function AdminPeriodSettingsRoute() {
  return (
    <div className="space-y-6">
      <PeriodSettingList />
      <TimetableTemplateManageList />
      <RaTemplateManageList />
    </div>
  );
}
