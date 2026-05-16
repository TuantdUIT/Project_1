import CourseCard from './course-card';
import React from 'react';

interface Course {
  type: 'F' | 'A' | 'S';
  title: string;
  subtitle: string;
  description: string;
  lessons: number;
  students: string;
  color: string;
}

interface CourseSectionProps {
  key?: React.Key;
  title: string;
  badgeText: string;
  courses: Course[];
  onCourseClick: (courseId: string) => void;
}

export default function CourseSection({ title, badgeText, courses, onCourseClick }: CourseSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold text-on-surface tracking-tight">
          {title} <span className="text-on-surface-variant font-medium">({badgeText})</span>
        </h2>
        <a href="#" className="text-sm font-bold text-indigo-deep hover:underline">
          Xem tất cả ›
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course, idx) => (
          <CourseCard 
            key={idx} 
            type={course.type}
            title={course.title}
            subtitle={course.subtitle}
            description={course.description}
            lessons={course.lessons}
            students={course.students}
            color={course.color}
            badgeText={badgeText}
            onClick={() => onCourseClick(`${badgeText}-${course.type}`)}
          />
        ))}
      </div>
    </section>
  );
}
