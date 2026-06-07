
// Ảnh online cho đội ngũ giảng dạy (Google Drive direct link)
const ODD_IMAGE = 'https://drive.google.com/thumbnail?id=1R4ETMUH3j6EWIHXMT3yhB58jZW7BDjGR&sz=w1000';
const EVEN_IMAGE = 'https://drive.google.com/thumbnail?id=1kGIWei53YMLfMKmSqmCM5wbca3LrN_FQ&sz=w1000';

const teachers = [
  {
    name: 'Thầy Nguyễn Văn A',
    title: 'Chuyên gia Toán học',
    bio: '15 năm kinh nghiệm luyện thi ĐH, tác giả của nhiều đầu sách tham khảo nổi tiếng.',
    image: ODD_IMAGE
  },
  {
    name: 'Cô Trần Thị B',
    title: 'Thạc sĩ Ngữ văn',
    bio: 'Truyền cảm hứng học Văn qua phương pháp tư duy sơ đồ hóa hiện đại.',
    image: EVEN_IMAGE
  },
  {
    name: 'Thầy Lê Văn C',
    title: 'Tiến sĩ Vật lý',
    bio: 'Giảng viên đại học uy tín, chuyên luyện thi các kỳ thi đánh giá năng lực.',
    image: ODD_IMAGE
  },
  {
    name: 'Cô Phạm Thị D',
    title: 'Giảng viên Tiếng Anh',
    bio: 'Sở hữu chứng chỉ IELTS 8.5, chuyên đào tạo ngữ pháp và kỹ năng thi cử.',
    image: EVEN_IMAGE
  },
  {
    name: 'Thầy Hoàng Văn E',
    title: 'Chuyên gia Hóa học',
    bio: 'Phương pháp giải nhanh trắc nghiệm Hóa học độc quyền, giúp học sinh đạt điểm 9+.',
    image: ODD_IMAGE
  },
  {
    name: 'Cô Vũ Thị F',
    title: 'Thạc sĩ Sinh học',
    bio: 'Kinh nghiệm luyện thi học sinh giỏi Quốc gia, truyền đạt kiến thức sinh động.',
    image: EVEN_IMAGE
  },
  {
    name: 'Thầy Đinh Văn G',
    title: 'Giảng viên Lịch sử',
    bio: 'Biến những con số và sự kiện khô khan thành những câu chuyện lịch sử hấp dẫn.',
    image: ODD_IMAGE
  },
  {
    name: 'Cô Lý Thị H',
    title: 'Chuyên gia Địa lý',
    bio: 'Sử dụng Atlat và sơ đồ tư duy giúp học sinh nắm bắt kiến thức Địa lý dễ dàng.',
    image: EVEN_IMAGE
  }
];

export default function TeacherSection() {
  return (
    <section className="py-20 bg-surface-container-low overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
        <h2 className="text-3xl font-bold text-indigo-500 mb-2">Đội ngũ giảng dạy</h2>
        <p className="text-on-surface-variant">Những chuyên gia hàng đầu, tận tâm và giàu kinh nghiệm</p>
      </div>
        
      <div className="relative w-full">
        <div className="flex w-max animate-marquee-rtl gap-8 px-4">
          {[...teachers, ...teachers].map((teacher, idx) => (
            <div key={idx} className="card-surface p-6 flex flex-col items-center text-center group hover:shadow-academic-lg transition-shadow w-72 shrink-0">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-academic-sm">
                  <img 
                    src={teacher.image} 
                    alt={teacher.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${teacher.name}/200/200`;
                    }}
                  />
                </div>
              </div>
              
              <h3 className="font-bold text-lg text-on-surface mb-1">{teacher.name}</h3>
              <p className="text-indigo-deep text-sm font-semibold mb-4">{teacher.title}</p>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                {teacher.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
