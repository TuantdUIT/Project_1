import type {
  LessonType,
  MergedTimetableItem,
  TimetableCardLayout,
  TimetableLayoutResult,
} from '@/features/timetable-template/types';
import {
  DEFAULT_LESSON_DURATION_MINUTES,
  GRID_FALLBACK_END_HOUR,
  GRID_FALLBACK_START_HOUR,
  dayOfWeekIndex,
  formatMinutes,
  parseHHmm,
} from './time';

type NormalizedCard = TimetableCardLayout & {
  columnIndex: number;
  columnCount: number;
};

export function buildTimetableLayout(
  items: MergedTimetableItem[],
  lessonTypes: LessonType[],
  hourHeightPx: number,
): TimetableLayoutResult {
  const durationByLessonTypeId = new Map(
    lessonTypes
      .filter((lessonType) => lessonType.lesson_type_uuid)
      .map((lessonType) => [lessonType.lesson_type_uuid, lessonType.lesson_time]),
  );
  const seenIds = new Set<string>();
  const cards: NormalizedCard[] = [];

  for (const [index, item] of items.entries()) {
    const dayIndex = dayOfWeekIndex(item.day_of_week);
    if (dayIndex < 0) {
      console.warn('Bỏ qua timetable item vì day_of_week không hợp lệ', item);
      continue;
    }

    const startMinutes = parseHHmm(item.start_time);
    if (startMinutes == null) {
      console.warn('Bỏ qua timetable item vì start_time không hợp lệ', item);
      continue;
    }

    const rawId =
      item.timetable_template_item_uuid
      ?? `${item._template_uuid ?? item._source_grade_name}-${item.day_of_week}-${item.start_time}-${item.lesson_type_uuid ?? index}`;
    if (seenIds.has(rawId)) {
      console.warn('Bỏ qua timetable item trùng id', item);
      continue;
    }
    seenIds.add(rawId);

    const duration = durationByLessonTypeId.get(item.lesson_type_uuid ?? '')
      ?? DEFAULT_LESSON_DURATION_MINUTES;
    if (!durationByLessonTypeId.has(item.lesson_type_uuid ?? '')) {
      console.warn('Không tìm thấy lesson_time, dùng duration fallback 60 phút', item);
    }

    const endMinutes = startMinutes + duration;
    cards.push({
      id: rawId,
      item,
      dayIndex,
      topPx: 0,
      heightPx: Math.max(44, (duration / 60) * hourHeightPx),
      leftPercent: 0,
      widthPercent: 0,
      startMinutes,
      endMinutes,
      startLabel: formatMinutes(startMinutes),
      endLabel: formatMinutes(endMinutes),
      columnIndex: 0,
      columnCount: 1,
    });
  }

  const startHour = cards.length
    ? Math.floor(Math.min(...cards.map((card) => card.startMinutes)) / 60)
    : GRID_FALLBACK_START_HOUR;
  const endHour = cards.length
    ? Math.ceil(Math.max(...cards.map((card) => card.endMinutes)) / 60)
    : GRID_FALLBACK_END_HOUR;
  const boundedStartHour = Math.max(0, Math.min(startHour, 23));
  const boundedEndHour = Math.max(boundedStartHour + 1, Math.min(endHour, 24));
  const dayWidthPercent = 100 / 7;

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const dayCards = cards
      .filter((card) => card.dayIndex === dayIndex)
      .sort((a, b) => a.startMinutes - b.startMinutes || (a.item.sort_order ?? 0) - (b.item.sort_order ?? 0));

    const groups: NormalizedCard[][] = [];
    let currentGroup: NormalizedCard[] = [];
    let currentGroupEnd = -1;

    for (const card of dayCards) {
      if (!currentGroup.length || card.startMinutes < currentGroupEnd) {
        currentGroup.push(card);
        currentGroupEnd = Math.max(currentGroupEnd, card.endMinutes);
      } else {
        groups.push(currentGroup);
        currentGroup = [card];
        currentGroupEnd = card.endMinutes;
      }
    }

    if (currentGroup.length) {
      groups.push(currentGroup);
    }

    for (const group of groups) {
      const columns: number[] = [];

      for (const card of group) {
        let columnIndex = columns.findIndex((endMinutes) => endMinutes <= card.startMinutes);
        if (columnIndex < 0) {
          columnIndex = columns.length;
          columns.push(card.endMinutes);
        } else {
          columns[columnIndex] = card.endMinutes;
        }

        card.columnIndex = columnIndex;
      }

      const columnCount = Math.max(columns.length, 1);
      for (const card of group) {
        card.columnCount = columnCount;
        card.topPx = ((card.startMinutes - boundedStartHour * 60) / 60) * hourHeightPx;
        card.leftPercent = dayIndex * dayWidthPercent + (card.columnIndex * dayWidthPercent) / columnCount;
        card.widthPercent = dayWidthPercent / columnCount;
      }
    }
  }

  return {
    cards: cards.map(({ columnIndex: _columnIndex, columnCount: _columnCount, ...card }) => card),
    startHour: boundedStartHour,
    endHour: boundedEndHour,
    totalHeightPx: (boundedEndHour - boundedStartHour) * hourHeightPx,
  };
}
