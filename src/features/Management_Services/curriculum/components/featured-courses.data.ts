import f10 from '@/app/routes/app/Management_Services/app/K10/foundation_10.json';
import s10 from '@/app/routes/app/Management_Services/app/K10/Strategy_10.json';
import a10 from '@/app/routes/app/Management_Services/app/K10/Advance_10.json';
import f11 from '@/app/routes/app/Management_Services/app/K11/foundation_11.json';
import s11 from '@/app/routes/app/Management_Services/app/K11/Strategy_11.json';
import a11 from '@/app/routes/app/Management_Services/app/K11/Advance_11.json';
import f12 from '@/app/routes/app/Management_Services/app/K12/foundation_12.json';
import s12 from '@/app/routes/app/Management_Services/app/K12/Strategy_12.json';
import a12 from '@/app/routes/app/Management_Services/app/K12/Advance_12.json';

type CourseInput = {
  title: string;
  description: string;
  cover: { letter: string; headline: string; fullName: string; caption: string };
  [key: string]: unknown;
};

function toTier(course: CourseInput) {
  return {
    key: course.cover.letter,
    letter: course.cover.letter,
    headline: course.cover.headline,
    fullName: course.cover.fullName,
    caption: course.cover.caption,
    cardTitle: course.title,
    description: course.description,
  };
}

const mockCourses = {
  grades: [
    {
      key: 'grade-10',
      gradeId: 10,
      label: 'Lớp 10',
      color: '#4F46E5',
      tiers: [toTier(f10.course), toTier(s10.course), toTier(a10.course)],
    },
    {
      key: 'grade-11',
      gradeId: 11,
      label: 'Lớp 11',
      color: '#7C3AED',
      tiers: [toTier(f11.course), toTier(s11.course), toTier(a11.course)],
    },
    {
      key: 'grade-12',
      gradeId: 12,
      label: 'Lớp 12',
      color: '#DB2777',
      tiers: [toTier(f12.course), toTier(s12.course), toTier(a12.course)],
    },
  ],
  dgnl: {
    key: 'DGNL',
    label: 'ĐGNL',
    color: '#0EA5E9',
    tier: {
      key: 'DGNL-TIER',
      letter: 'ĐG',
      headline: 'ĐÁNH GIÁ NĂNG LỰC',
      fullName: 'COMPETENCY ASSESSMENT',
      caption: 'LUYỆN THI ĐGNL ĐHQG',
      cardTitle: 'Luyện thi Đánh giá năng lực tư duy toán học',
      description:
        'Khóa học chuyên biệt luyện thi ĐGNL ĐHQG, tập trung vào tư duy logic, phân tích dữ liệu và giải quyết vấn đề thực tiễn.',
    },
  },
};

export default mockCourses;
