import { makeSlotKey } from '@/features/Management_Services/employee-ra-template/lib/slot-key';
import type {
  EmployeeRATemplate,
  EmployeeRATemplateItem,
} from '@/features/Management_Services/employee-ra-template/types';
import type { MergedTimetableItem } from '@/features/Management_Services/timetable-template/types';

const scopedSlotKey = (templateUuid: string | undefined, slotKey: string) =>
  `${templateUuid ?? 'unknown'}::${slotKey}`;

export function attachPersonnelToTimetableItems(
  items: MergedTimetableItem[],
  templatesByUuid: ReadonlyMap<string, EmployeeRATemplate | undefined>,
) {
  if (!templatesByUuid.size) {
    return items.map((item) => ({ ...item, _personnel: [] }));
  }

  const validKeys = new Set<string>();
  for (const item of items) {
    const key = makeSlotKey(item);
    if (key) {
      validKeys.add(scopedSlotKey(item._template_uuid, key));
    }
  }

  const personnelBySlot = new Map<string, EmployeeRATemplateItem[]>();
  for (const [templateUuid, template] of templatesByUuid) {
    for (const personnel of template?.items ?? []) {
      const key = makeSlotKey(personnel);
      const scopedKey = key ? scopedSlotKey(templateUuid, key) : null;

      if (!scopedKey || !validKeys.has(scopedKey)) {
        console.warn('Bo qua EmployeeRATemplate item khong khop timetable slot', personnel);
        continue;
      }

      const list = personnelBySlot.get(scopedKey) ?? [];
      list.push(personnel);
      personnelBySlot.set(scopedKey, list);
    }
  }

  for (const list of personnelBySlot.values()) {
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  return items.map((item) => {
    const key = makeSlotKey(item);
    const personnel = key ? personnelBySlot.get(scopedSlotKey(item._template_uuid, key)) : undefined;
    return {
      ...item,
      _personnel: personnel ?? [],
    };
  });
}
