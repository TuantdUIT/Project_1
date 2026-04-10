import React from 'react';
import { PlayCircle, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface CourseCardProps {
  key?: React.Key;
  type: 'F' | 'A' | 'S';
  title: string;
  subtitle: string;
  description: string;
  lessons: number;
  students: string;
  color: string;
  badgeText: string;
  onClick?: () => void;
}

export default function CourseCard({
  type,
  title,
  subtitle,
  description,
  lessons,
  students,
  color,
  badgeText,
  onClick
}: CourseCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="card-surface flex flex-col h-full cursor-pointer"
      onClick={onClick}
    >
      {/* Visual Header */}
      <div 
        className="relative aspect-[4/3] flex flex-col items-center justify-center text-center p-6 text-white overflow-hidden"
        style={{ backgroundColor: color }}
      >
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 micro-label opacity-80">{badgeText}</div>
        <div className="absolute top-4 right-4">
           <div className="w-6 h-6 bg-white/20 rounded-full blur-sm" />
        </div>
        
        <div className="mb-2 text-sm font-bold opacity-90">{badgeText}</div>
        <div className="text-lg font-extrabold mb-1 tracking-tight">{subtitle}</div>
        
        <div className="text-[120px] font-black leading-none my-2 drop-shadow-2xl">
          {type}
        </div>
        
        <div className="mt-2 text-sm font-bold tracking-wide uppercase">
          {title.split(' - ')[1] || title}
        </div>
        <div className="text-[10px] font-medium opacity-80 mt-1">TOÁN HỌC - CHUYÊN SÂU TRỌNG TÂM</div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-on-surface mb-1 leading-tight">
          {title}
        </h3>
        <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">
          {description}
        </p>
        
        <div className="mt-auto">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant">
              <PlayCircle size={14} className="text-indigo-deep" />
              {lessons} bài giảng
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant">
              <Users size={14} className="text-indigo-deep" />
              {students} học viên
            </div>
          </div>
          
          <button className="w-full btn-primary py-2 text-sm font-bold">
            Đăng ký
          </button>
        </div>
      </div>
    </motion.div>
  );
}
