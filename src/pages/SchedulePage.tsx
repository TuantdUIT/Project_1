import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Grid3X3,
  Calendar as CalendarIcon 
} from 'lucide-react';

interface ScheduleEvent {
  id: string;
  grade: '2k8' | '2k9' | '2k10';
  day: number; // 0: Sun, 1: Mon, ..., 6: Sat
  startTime: string; // "08:00"
  endTime: string;
  title: string;
  subtitle: string;
  color: string;
}

const scheduleData: ScheduleEvent[] = [
  // 2k8 (Grade 12) - Intensive Prep
  {
    id: '1',
    grade: '2k8',
    day: 1, // Mon
    startTime: '08:00',
    endTime: '09:30',
    title: 'Toán học 2k8 Nền tảng (F)',
    subtitle: 'Đại số & Giải tích',
    color: '#1152D4'
  },
  {
    id: '2',
    grade: '2k8',
    day: 3, // Wed
    startTime: '19:00',
    endTime: '20:30',
    title: 'Toán học 2k8 Luyện đề (S)',
    subtitle: 'Chiến thuật phòng thi',
    color: '#1152D4'
  },
  {
    id: '3',
    grade: '2k8',
    day: 5, // Fri
    startTime: '10:00',
    endTime: '11:30',
    title: 'Toán học 2k8 Nâng cao (A)',
    subtitle: 'Vận dụng cao Hàm số',
    color: '#1152D4'
  },
  {
    id: '4',
    grade: '2k8',
    day: 6, // Sat
    startTime: '09:00',
    endTime: '11:00',
    title: 'Toán học 2k8 Tổng ôn',
    subtitle: 'Rà soát kiến thức 12',
    color: '#1152D4'
  },
  // 2k9 (Grade 11) - Core Knowledge
  {
    id: '5',
    grade: '2k9',
    day: 2, // Tue
    startTime: '14:00',
    endTime: '15:30',
    title: 'Toán học 2k9 Nền tảng (F)',
    subtitle: 'Lượng giác cơ bản',
    color: '#38bdf8'
  },
  {
    id: '6',
    grade: '2k9',
    day: 4, // Thu
    startTime: '15:00',
    endTime: '16:30',
    title: 'Toán học 2k9 Nâng cao (A)',
    subtitle: 'Hình học không gian',
    color: '#38bdf8'
  },
  {
    id: '7',
    grade: '2k9',
    day: 6, // Sat
    startTime: '14:00',
    endTime: '15:30',
    title: 'Toán học 2k9 Chiến thuật (S)',
    subtitle: 'Giải nhanh trắc nghiệm',
    color: '#38bdf8'
  },
  // 2k10 (Grade 10) - Foundation
  {
    id: '8',
    grade: '2k10',
    day: 1, // Mon
    startTime: '15:30',
    endTime: '17:00',
    title: 'Toán học 2k10 Nền tảng (F)',
    subtitle: 'Mệnh đề & Tập hợp',
    color: '#22c55e'
  },
  {
    id: '9',
    grade: '2k10',
    day: 3, // Wed
    startTime: '08:00',
    endTime: '09:30',
    title: 'Toán học 2k10 Nâng cao (A)',
    subtitle: 'Bất đẳng thức',
    color: '#22c55e'
  },
  {
    id: '10',
    grade: '2k10',
    day: 5, // Fri
    startTime: '14:00',
    endTime: '15:30',
    title: 'Toán học 2k10 Chiến thuật (S)',
    subtitle: 'Kỹ năng làm bài 10',
    color: '#22c55e'
  }
];

const days = [
  { name: 'SUN', date: '5' },
  { name: 'MON', date: '6' },
  { name: 'TUE', date: '7' },
  { name: 'WED', date: '8', isToday: true },
  { name: 'THU', date: '9' },
  { name: 'FRI', date: '10' },
  { name: 'SAT', date: '11' }
];

const hours = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

export default function SchedulePage() {
  const [activeGrade, setActiveGrade] = useState<'2k8' | '2k9' | '2k10'>('2k8');

  const filteredEvents = scheduleData.filter(event => event.grade === activeGrade);

  const getEventStyle = (event: ScheduleEvent) => {
    const startHour = parseInt(event.startTime.split(':')[0]);
    const startMin = parseInt(event.startTime.split(':')[1]);
    const endHour = parseInt(event.endTime.split(':')[0]);
    const endMin = parseInt(event.endTime.split(':')[1]);

    const top = startHour * 60 + startMin;
    const height = (endHour - startHour) * 60 + (endMin - startMin);

    return {
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: event.color,
    };
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Grade Selector Row */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['2k8', '2k9', '2k10'] as const).map((grade) => (
            <button
              key={grade}
              onClick={() => setActiveGrade(grade)}
              className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${
                activeGrade === grade
                  ? 'bg-white text-indigo-deep shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {grade}
            </button>
          ))}
        </div>
      </div>

      {/* Google Calendar Style Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50">
            Today
          </button>
          <div className="flex items-center gap-1">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <ChevronLeft size={20} />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <ChevronRight size={20} />
            </button>
          </div>
          <h2 className="text-xl font-bold text-gray-800 ml-2">
            April 2026
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50">
                Week <ChevronDown size={16} />
              </button>
              {/* Simulated Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                <div className="py-1">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Day</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Week</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Month</button>
                </div>
              </div>
            </div>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <Grid3X3 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-[100px_1fr] border-b border-gray-300 bg-white">
          <div className="flex flex-col items-center justify-end pb-2 text-[10px] font-bold text-gray-500">
            GMT+07
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center py-3 border-l border-gray-300 first:border-l-0">
                <span className={`text-[11px] font-bold mb-1 ${day.isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                  {day.name}
                </span>
                <span className={`w-10 h-10 flex items-center justify-center text-2xl font-normal rounded-full ${
                  day.isToday ? 'bg-blue-600 text-white' : 'text-gray-800'
                }`}>
                  {day.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-grow overflow-y-auto relative">
          <div className="grid grid-cols-[100px_1fr] min-h-[1440px]">
            {/* Time Labels */}
            <div className="border-r border-gray-300">
              {hours.map((hour) => (
                <div key={hour} className="h-[60px] relative">
                  {hour > 0 && (
                    <span className="absolute -top-2.5 right-2 text-[10px] font-medium text-gray-500">
                      {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Grid and Events */}
            <div className="relative">
              {/* Horizontal Grid Lines - Bolder */}
              <div className="absolute inset-0 pointer-events-none">
                {hours.map((hour) => (
                  <div key={hour} className="h-[60px] border-b border-gray-200"></div>
                ))}
              </div>

              {/* Vertical Grid Lines - Bolder */}
              <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="border-r border-gray-200 h-full"></div>
                ))}
              </div>

              {/* Events Layer */}
              <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                {Array.from({ length: 7 }).map((_, dayIdx) => (
                  <div key={dayIdx} className="relative h-full">
                    {filteredEvents
                      .filter(event => event.day === dayIdx)
                      .map(event => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute left-1 right-1 rounded-md p-2 text-white shadow-sm pointer-events-auto cursor-pointer overflow-hidden border border-white/20 z-10"
                          style={getEventStyle(event)}
                        >
                          <div className="flex flex-col h-full">
                            <h4 className="text-[11px] font-bold leading-tight mb-0.5 truncate">
                              {event.title}
                            </h4>
                            <p className="text-[10px] opacity-90 truncate">
                              {event.startTime} - {event.endTime}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend - Floating or Bottom */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#1152D4]" />
          <span className="text-[11px] font-medium text-gray-600">Lớp 2k8</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#38bdf8]" />
          <span className="text-[11px] font-medium text-gray-600">Lớp 2k9</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
          <span className="text-[11px] font-medium text-gray-600">Lớp 2k10</span>
        </div>
      </div>
    </div>
  );
}
