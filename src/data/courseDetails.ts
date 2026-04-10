export interface Lesson {
  title: string;
  duration?: string;
  type: 'video' | 'document' | 'quiz';
}

export interface Week {
  title: string;
  lessons: Lesson[];
}

export interface CourseDetail {
  id: string;
  type: 'F' | 'A' | 'S';
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  discount: string;
  instructor: {
    name: string;
    title: string;
    image: string;
  };
  badge: string;
  color: string;
  objectives: string[];
  program: string[];
  quantity: string;
  curriculum: Week[];
}

export const courseDetails: Record<string, CourseDetail> = {
  '2k8-F': {
    id: '2k8-F',
    type: 'F',
    title: 'Toán học 12 - Khóa Foundation',
    description: 'Khóa học xây dựng nền móng vững chắc, giúp học sinh lấy lại căn bản và làm chủ toàn bộ kiến thức trọng tâm.',
    price: '1.200.000đ',
    originalPrice: '2.000.000đ',
    discount: '-40%',
    instructor: {
      name: 'ThS. Nguyễn Văn A',
      title: 'GIẢNG VIÊN HƯỚNG DẪN',
      image: '/assets/teachers/teacher1.jpg'
    },
    badge: '2k8',
    color: '#38bdf8',
    objectives: [
      'Nắm chắc lý thuyết cơ bản, giải quyết tốt các bài tập mức độ Nhận biết và Thông hiểu (mục tiêu 7+).',
      'Bám sát 100% SGK mới (Kết nối tri thức, Cánh diều, Chân trời sáng tạo). Bao gồm các chuyên đề: Hàm số, Vectơ trong không gian, Xác suất, Số phức (theo khung chương trình mới).'
    ],
    program: [
      'Hơn 120 bài giảng chi tiết, chia nhỏ từng dạng bài để học sinh dễ hấp thụ.'
    ],
    quantity: 'Hơn 120 bài giảng chi tiết',
    curriculum: [
      {
        title: 'Tuần 1: Sự biến thiên và Cực trị (Nhận biết/Thông hiểu).',
        lessons: [
          { title: '1.1 Định nghĩa tính đơn điệu của hàm số', duration: '18:24', type: 'video' },
          { title: '1.2 Các quy tắc tìm cực trị của hàm số', duration: '25:10', type: 'video' },
          { title: 'Bài tập rèn luyện Tuần 1', type: 'document' }
        ]
      },
      { title: 'Tuần 2: GTLN - GTNN & Tiệm cận của đồ thị hàm số.', lessons: [] },
      { title: 'Tuần 3: Khảo sát hàm số & Các bài toán tương giao cơ bản.', lessons: [] },
      { title: 'Tuần 4: Hàm số Lũy thừa, Mũ và Logarit (Định nghĩa & Tính chất).', lessons: [] },
      { title: 'Tuần 5: Giải phương trình và Bất phương trình Mũ - Logarit cơ bản.', lessons: [] },
      { title: 'Tuần 6: Khối đa diện và Thể tích khối đa diện (Lăng trụ, chóp).', lessons: [] },
      { title: 'Tuần 7: Nguyên hàm và các bảng công thức cơ bản.', lessons: [] },
      { title: 'Tuần 8: Tích phân và Ứng dụng tính diện tích, thể tích.', lessons: [] },
      { title: 'Tuần 9: Số phức: Các phép toán và Biểu diễn hình học.', lessons: [] },
      { title: 'Tuần 10: Tọa độ trong không gian Oxyz (Điểm, Vectơ, Mặt phẳng).', lessons: [] },
      { title: 'Tuần 11: Đường thẳng và Mặt cầu trong Oxyz.', lessons: [] },
      { title: 'Tuần 12: Tổng ôn kiến thức F & Kiểm tra cuối khóa (Checkpoint 1).', lessons: [] }
    ]
  },
  '2k8-A': {
    id: '2k8-A',
    type: 'A',
    title: 'Toán học 12 - Khóa Advance',
    description: 'Khóa học bứt phá điểm số với các kỹ thuật giải nhanh và tư duy toán học đỉnh cao, giúp học sinh chinh phục mục tiêu 9+ trong các kỳ thi quốc gia.',
    price: '1.500.000đ',
    originalPrice: '2.500.000đ',
    discount: '-40%',
    instructor: {
      name: 'ThS. Nguyễn Văn A',
      title: 'GIẢNG VIÊN HƯỚNG DẪN',
      image: '/assets/teachers/teacher1.jpg'
    },
    badge: '2k8',
    color: '#1152D4',
    objectives: [
      'Chinh phục các câu hỏi khó, các chuyên đề tích hợp (mục tiêu 8.5+ và 9+).',
      'Tập trung vào các phương pháp tư duy đặc biệt: Ghép trục, sơ đồ V, kỹ thuật chọn hàm, Casio bổ trợ nâng cao và các bài toán thực tế trong chương trình mới.'
    ],
    program: [
      'Được biên soạn mới hoàn toàn, cập nhật các xu hướng ra đề của Bộ GD&ĐT và các kỳ thi riêng (ĐGNL, ĐGTD).'
    ],
    quantity: 'Hơn 100 bài giảng nâng cao',
    curriculum: [
      {
        title: 'Tuần 1: Kỹ thuật sơ đồ V và Ghép trục trong giải toán hàm hợp.',
        lessons: [
          { title: '1.1 Tổng quan về phương pháp Ghép trục', duration: '25:15', type: 'video' },
          { title: '1.2 Kỹ thuật Sơ đồ V trong giải toán hàm hợp', duration: '32:40', type: 'video' },
          { title: 'Bài tập vận dụng cao Tuần 1', type: 'document' }
        ]
      },
      { title: 'Tuần 2: Cực trị hàm chứa dấu giá trị tuyệt đối (Vận dụng cao).', lessons: [] },
      { title: 'Tuần 3: Bài toán Max-Min và Tiệm cận chứa tham số m.', lessons: [] },
      { title: 'Tuần 4: Biến đổi Logarit phức tạp & Phương pháp đặc trưng.', lessons: [] },
      { title: 'Tuần 5: Các bài toán lãi suất, thực tế và ứng dụng thực tiễn.', lessons: [] },
      { title: 'Tuần 6: Tổ hợp - Xác suất (Các bài toán đếm khó và xác suất có điều kiện).', lessons: [] },
      { title: 'Tuần 7: Tích phân hàm ẩn và các phương pháp đổi biến, từng phần nâng cao.', lessons: [] },
      { title: 'Tuần 8: Cực trị số phức (Phương pháp hình học & Đại số).', lessons: [] },
      { title: 'Tuần 9: Cực trị hình học Oxyz (Các bài toán về khoảng cách và góc).', lessons: [] },
      { title: 'Tuần 10: Tương quan vị trí và bài toán phối hợp Oxyz.', lessons: [] },
      { title: 'Tuần 11: Chuyên đề tư duy hình học không gian (Góc, khoảng cách lớp 11 nâng cao).', lessons: [] },
      { title: 'Tuần 12: Tổng ôn kiến thức & Kiểm tra cuối khóa (Checkpoint 2).', lessons: [] }
    ]
  },
  '2k8-S': {
    id: '2k8-S',
    type: 'S',
    title: 'Toán học 12 - Khóa Strategy',
    description: 'Chương trình ôn luyện cường độ cao, tập trung tối ưu hóa điểm số thông qua các chiến thuật giải đề thực chiến và kỹ năng xử lý bẫy lý thuyết.',
    price: '1.500.000đ',
    originalPrice: '2.500.000đ',
    discount: '-40%',
    instructor: {
      name: 'ThS. Nguyễn Văn A',
      title: 'GIẢNG VIÊN HƯỚNG DẪN',
      image: '/assets/teachers/teacher1.jpg'
    },
    badge: '2k8',
    color: '#ea580c',
    objectives: [
      'Quét sạch mọi dạng bài, tối ưu thời gian làm bài và đạt điểm rơi phong độ cao nhất.',
      'Tổng ôn toàn bộ kiến thức lớp 10, 11, 12 có trong ma trận đề thi. Luyện bộ đề thực chiến (Đề minh họa, đề của các Sở và các trường chuyên trên cả nước).'
    ],
    program: [
      'Chiến thuật phân bổ thời gian, kỹ năng nhận diện bẫy trong đề thi trắc nghiệm theo định dạng mới của Bộ.'
    ],
    quantity: 'Bộ đề thực chiến 2026',
    curriculum: [
      {
        title: 'Tuần 1: Quét lỗi sai lý thuyết (Bẫy thường gặp trong 35 câu đầu).',
        lessons: [
          { title: '1.1 Tổng hợp các bẫy lý thuyết thường gặp', duration: '45:00', type: 'video' },
          { title: 'Bài tập rèn luyện bẫy lý thuyết', type: 'document' }
        ]
      },
      { title: 'Tuần 2: Kỹ thuật bấm máy Casio hỗ trợ giải nhanh & Kiểm tra ngược.', lessons: [] },
      { title: 'Tuần 3: Luyện đề chuyên đề: Hàm số - Mũ - Log (60 phút/đề).', lessons: [] },
      { title: 'Tuần 4: Luyện đề chuyên đề: Giải tích - Oxyz (60 phút/đề).', lessons: [] },
      { title: 'Tuần 5: Chiến thuật phân bổ thời gian: "Quy tắc 30-30-30".', lessons: [] },
      { title: 'Tuần 6: Thực chiến đề thi thử các trường chuyên (Đợt 1).', lessons: [] },
      { title: 'Tuần 7: Giải chi tiết bộ đề tinh hoa (Cập nhật cấu trúc 2026).', lessons: [] },
      { title: 'Tuần 8: Luyện đề áp lực thời gian (80 phút thay vì 90 phút).', lessons: [] },
      { title: 'Tuần 9: Phân tích cấu trúc câu hỏi 9+ và chiến thuật "khoanh vùng".', lessons: [] },
      { title: 'Tuần 10: Đề dự đoán số 1 & Tổng rà soát kiến thức toàn diện.', lessons: [] },
      { title: 'Tuần 11: Đề dự đoán số 2 & Ổn định tâm lý phòng thi.', lessons: [] },
      { title: 'Tuần 12: Về đích: Chốt kỹ năng cuối cùng & Lên dây cót tinh thần.', lessons: [] }
    ]
  },
  '2k9-F': {
    id: '2k9-F',
    type: 'F',
    title: 'Toán học 11 - Khóa Foundation',
    description: 'Khóa học xây dựng nền móng vững chắc môn Toán 11, giúp học sinh nắm vững lý thuyết và các dạng bài tập cơ bản theo chương trình mới.',
    price: '1.200.000đ',
    originalPrice: '2.000.000đ',
    discount: '-40%',
    instructor: {
      name: 'ThS. Nguyễn Văn A',
      title: 'GIẢNG VIÊN HƯỚNG DẪN',
      image: '/assets/teachers/teacher1.jpg'
    },
    badge: '2k9',
    color: '#f97316',
    objectives: [
      'Nắm chắc lý thuyết cơ bản Toán 11, giải quyết tốt các bài tập mức độ Nhận biết và Thông hiểu.',
      'Bám sát chương trình GDPT mới, chuẩn bị hành trang vững chắc cho kỳ thi tốt nghiệp THPT.'
    ],
    program: [
      'Hơn 120 bài giảng chi tiết, chia nhỏ từng dạng bài để học sinh dễ hấp thụ.'
    ],
    quantity: 'Hơn 120 bài giảng chi tiết',
    curriculum: [
      {
        title: 'Tuần 1: Hàm số lượng giác và phương trình lượng giác cơ bản.',
        lessons: [
          { title: '1.1 Các hàm số lượng giác cơ bản', duration: '20:15', type: 'video' },
          { title: '1.2 Giải phương trình lượng giác cơ bản', duration: '28:30', type: 'video' },
          { title: 'Bài tập rèn luyện Tuần 1', type: 'document' }
        ]
      },
      { title: 'Tuần 2: Dãy số, cấp số cộng và cấp số nhân.', lessons: [] },
      { title: 'Tuần 3: Giới hạn của dãy số và hàm số.', lessons: [] },
      { title: 'Tuần 4: Hàm số liên tục.', lessons: [] },
      { title: 'Tuần 5: Đường thẳng và mặt phẳng trong không gian.', lessons: [] },
      { title: 'Tuần 6: Quan hệ song song trong không gian.', lessons: [] },
      { title: 'Tuần 7: Các số đặc trưng đo xu thế trung tâm cho mẫu số liệu ghép nhóm.', lessons: [] },
      { title: 'Tuần 8: Phép tính đạo hàm cơ bản.', lessons: [] },
      { title: 'Tuần 9: Quan hệ vuông góc trong không gian.', lessons: [] },
      { title: 'Tuần 10: Phép chiếu vuông góc và góc trong không gian.', lessons: [] },
      { title: 'Tuần 11: Khoảng cách trong không gian.', lessons: [] },
      { title: 'Tuần 12: Tổng ôn kiến thức học kỳ và kiểm tra cuối khóa.', lessons: [] }
    ]
  },
  '2k9-A': {
    id: '2k9-A',
    type: 'A',
    title: 'Toán học 11 - Khóa Advance',
    description: 'Khóa học nâng cao tư duy Toán 11, bứt phá điểm số với các kỹ thuật giải toán hiện đại và chuyên sâu.',
    price: '1.500.000đ',
    originalPrice: '2.500.000đ',
    discount: '-40%',
    instructor: {
      name: 'ThS. Nguyễn Văn A',
      title: 'GIẢNG VIÊN HƯỚS DẪN',
      image: '/assets/teachers/teacher1.jpg'
    },
    badge: '2k9',
    color: '#f97316',
    objectives: [
      'Chinh phục các câu hỏi vận dụng và vận dụng cao trong chương trình Toán 11.',
      'Rèn luyện tư duy logic và kỹ năng giải toán trắc nghiệm nhanh, chính xác.'
    ],
    program: [
      'Hệ thống bài giảng chuyên sâu, cập nhật các dạng toán mới nhất.'
    ],
    quantity: 'Hơn 100 bài giảng nâng cao',
    curriculum: [
      {
        title: 'Tuần 1: Kỹ thuật giải nhanh phương trình lượng giác phức tạp.',
        lessons: [
          { title: '1.1 Phương pháp đặt ẩn phụ nâng cao', duration: '30:45', type: 'video' },
          { title: '1.2 Sử dụng vòng tròn lượng giác giải nhanh', duration: '35:20', type: 'video' },
          { title: 'Bài tập vận dụng cao Tuần 1', type: 'document' }
        ]
      },
      { title: 'Tuần 2: Chuyên đề dãy số và các bài toán thực tế.', lessons: [] },
      { title: 'Tuần 3: Giới hạn và các kỹ thuật xử lý vô định.', lessons: [] },
      { title: 'Tuần 4: Ứng dụng tính liên tục trong chứng minh nghiệm.', lessons: [] },
      { title: 'Tuần 5: Hình học không gian: Các kỹ thuật xác định thiết diện.', lessons: [] },
      { title: 'Tuần 6: Quan hệ song song và các bài toán chứng minh nâng cao.', lessons: [] },
      { title: 'Tuần 7: Xác suất nâng cao và các quy tắc đếm phức tạp.', lessons: [] },
      { title: 'Tuần 8: Đạo hàm cấp cao và ứng dụng vật lý.', lessons: [] },
      { title: 'Tuần 9: Khoảng cách và góc: Kỹ thuật tọa độ hóa sơ bộ.', lessons: [] },
      { title: 'Tuần 10: Thể tích khối đa diện cơ bản (lồng ghép lớp 11).', lessons: [] },
      { title: 'Tuần 11: Tổng ôn tư duy hình học không gian.', lessons: [] },
      { title: 'Tuần 12: Kiểm tra năng lực và hướng dẫn lộ trình lớp 12.', lessons: [] }
    ]
  },
  '2k9-S': {
    id: '2k9-S',
    type: 'S',
    title: 'Toán học 11 - Khóa Strategy',
    description: 'Chiến thuật luyện đề và tổng ôn kiến thức trọng tâm Toán 11, tối ưu hóa phương pháp làm bài thi.',
    price: '1.500.000đ',
    originalPrice: '2.500.000đ',
    discount: '-40%',
    instructor: {
      name: 'ThS. Nguyễn Văn A',
      title: 'GIẢNG VIÊN HƯỚNG DẪN',
      image: '/assets/teachers/teacher1.jpg'
    },
    badge: '2k9',
    color: '#f97316',
    objectives: [
      'Tổng hợp toàn bộ kiến thức Toán 11, nhận diện các bẫy thường gặp.',
      'Rèn luyện kỹ năng thực chiến với bộ đề thi chuẩn cấu trúc mới.'
    ],
    program: [
      'Bộ đề thực chiến được thiết kế riêng cho học sinh 2k9.'
    ],
    quantity: 'Bộ đề thực chiến 2k9',
    curriculum: [
      {
        title: 'Tuần 1: Tổng ôn kiến thức học kỳ 1 và kỹ năng làm bài trắc nghiệm.',
        lessons: [
          { title: '1.1 Rà soát kiến thức trọng tâm HK1', duration: '50:00', type: 'video' },
          { title: 'Đề luyện tập tổng hợp số 1', type: 'document' }
        ]
      },
      { title: 'Tuần 2: Chiến thuật xử lý nhanh các câu hỏi Đại số.', lessons: [] },
      { title: 'Tuần 3: Kỹ thuật nhìn hình không gian và loại trừ đáp án.', lessons: [] },
      { title: 'Tuần 4: Luyện đề chuyên đề: Lượng giác và Dãy số.', lessons: [] },
      { title: 'Tuần 5: Luyện đề chuyên đề: Giới hạn và Đạo hàm.', lessons: [] },
      { title: 'Tuần 6: Thực chiến đề thi giữa kỳ các trường chuyên.', lessons: [] },
      { title: 'Tuần 7: Giải chi tiết bộ đề tinh hoa Toán 11.', lessons: [] },
      { title: 'Tuần 8: Kỹ năng sử dụng máy tính Casio tối ưu.', lessons: [] },
      { title: 'Tuần 9: Phân tích ma trận đề thi tốt nghiệp (phần lớp 11).', lessons: [] },
      { title: 'Tuần 10: Đề dự đoán số 1 Toán 11.', lessons: [] },
      { title: 'Tuần 11: Đề dự đoán số 2 Toán 11.', lessons: [] },
      { title: 'Tuần 12: Tổng kết khóa học và định hướng kỳ thi 2027.', lessons: [] }
    ]
  },
  '2k10-F': {
    id: '2k10-F',
    type: 'F',
    title: 'Toán học 10 - Khóa Foundation',
    description: 'Xây dựng nền tảng vững chắc môn Toán ngay từ năm đầu cấp ba, giúp học sinh làm quen với chương trình GDPT mới.',
    price: '1.200.000đ',
    originalPrice: '2.000.000đ',
    discount: '-40%',
    instructor: {
      name: 'ThS. Nguyễn Văn A',
      title: 'GIẢNG VIÊN HƯỚNG DẪN',
      image: '/assets/teachers/teacher1.jpg'
    },
    badge: '2k10',
    color: '#22c55e',
    objectives: [
      'Nắm chắc lý thuyết cơ bản Toán 10, giải quyết tốt các bài tập mức độ Nhận biết và Thông hiểu.',
      'Làm quen với các phương pháp học tập mới, rèn luyện kỹ năng trình bày và tư duy toán học.'
    ],
    program: [
      'Hơn 120 bài giảng chi tiết, chia nhỏ từng dạng bài để học sinh dễ hấp thụ.'
    ],
    quantity: 'Hơn 120 bài giảng chi tiết',
    curriculum: [
      {
        title: 'Tuần 1: Mệnh đề và Tập hợp.',
        lessons: [
          { title: '1.1 Các khái niệm về mệnh đề', duration: '15:20', type: 'video' },
          { title: '1.2 Tập hợp và các phép toán trên tập hợp', duration: '22:45', type: 'video' },
          { title: 'Bài tập rèn luyện Tuần 1', type: 'document' }
        ]
      },
      { title: 'Tuần 2: Bất phương trình và hệ bất phương trình bậc nhất hai ẩn.', lessons: [] },
      { title: 'Tuần 3: Hàm số và đồ thị.', lessons: [] },
      { title: 'Tuần 4: Hàm số bậc hai.', lessons: [] },
      { title: 'Tuần 5: Giá trị lượng giác của một góc từ 0 đến 180 độ.', lessons: [] },
      { title: 'Tuần 6: Hệ thức lượng trong tam giác.', lessons: [] },
      { title: 'Tuần 7: Vectơ và các phép toán trên vectơ.', lessons: [] },
      { title: 'Tuần 8: Tích vô hướng của hai vectơ.', lessons: [] },
      { title: 'Tuần 9: Các số đặc trưng đo xu thế trung tâm và mức độ phân tán.', lessons: [] },
      { title: 'Tuần 10: Quy tắc cộng và quy tắc nhân.', lessons: [] },
      { title: 'Tuần 11: Hoán vị, chỉnh hợp và tổ hợp.', lessons: [] },
      { title: 'Tuần 12: Nhị thức Newton và kiểm tra cuối khóa.', lessons: [] }
    ]
  },
  '2k10-A': {
    id: '2k10-A',
    type: 'A',
    title: 'Toán học 10 - Khóa Advance',
    description: 'Khóa học nâng cao tư duy Toán 10, tiếp cận các bài toán khó và rèn luyện kỹ năng giải toán chuyên sâu.',
    price: '1.500.000đ',
    originalPrice: '2.500.000đ',
    discount: '-40%',
    instructor: {
      name: 'ThS. Nguyễn Văn A',
      title: 'GIẢNG VIÊN HƯỚNG DẪN',
      image: '/assets/teachers/teacher1.jpg'
    },
    badge: '2k10',
    color: '#22c55e',
    objectives: [
      'Chinh phục các câu hỏi vận dụng và vận dụng cao trong chương trình Toán 10.',
      'Tiếp cận các phương pháp giải toán mới, bám sát định hướng thi ĐGNL và ĐGTD.'
    ],
    program: [
      'Hệ thống bài giảng nâng cao, tập trung vào tư duy và bản chất toán học.'
    ],
    quantity: 'Hơn 100 bài giảng nâng cao',
    curriculum: [
      {
        title: 'Tuần 1: Kỹ thuật xử lý các bài toán mệnh đề và tập hợp nâng cao.',
        lessons: [
          { title: '1.1 Chứng minh mệnh đề bằng phản chứng', duration: '28:15', type: 'video' },
          { title: '1.2 Các bài toán tập hợp chứa tham số', duration: '34:50', type: 'video' },
          { title: 'Bài tập vận dụng cao Tuần 1', type: 'document' }
        ]
      },
      { title: 'Tuần 2: Ứng dụng hệ bất phương trình bậc nhất hai ẩn trong bài toán thực tế.', lessons: [] },
      { title: 'Tuần 3: Các bài toán cực trị liên quan đến hàm số bậc hai.', lessons: [] },
      { title: 'Tuần 4: Kỹ thuật giải phương trình chứa căn thức.', lessons: [] },
      { title: 'Tuần 5: Hệ thức lượng trong tam giác và ứng dụng thực tiễn nâng cao.', lessons: [] },
      { title: 'Tuần 6: Kỹ thuật phân tích vectơ và chứng minh đẳng thức vectơ.', lessons: [] },
      { title: 'Tuần 7: Các bài toán cực trị và tập hợp điểm trong hình học vectơ.', lessons: [] },
      { title: 'Tuần 8: Phương pháp tọa độ trong mặt phẳng: Đường thẳng.', lessons: [] },
      { title: 'Tuần 9: Phương pháp tọa độ trong mặt phẳng: Đường tròn.', lessons: [] },
      { title: 'Tuần 10: Ba đường Conic trong mặt phẳng.', lessons: [] },
      { title: 'Tuần 11: Chuyên đề xác suất và tổ hợp nâng cao.', lessons: [] },
      { title: 'Tuần 12: Tổng ôn tư duy Toán 10 và kiểm tra năng lực.', lessons: [] }
    ]
  },
  '2k10-S': {
    id: '2k10-S',
    type: 'S',
    title: 'Toán học 10 - Khóa Strategy',
    description: 'Chiến thuật luyện đề và tổng ôn kiến thức trọng tâm Toán 10, tối ưu hóa điểm số và kỹ năng làm bài.',
    price: '1.500.000đ',
    originalPrice: '2.500.000đ',
    discount: '-40%',
    instructor: {
      name: 'ThS. Nguyễn Văn A',
      title: 'GIẢNG VIÊN HƯỚNG DẪN',
      image: '/assets/teachers/teacher1.jpg'
    },
    badge: '2k10',
    color: '#22c55e',
    objectives: [
      'Tổng hợp toàn bộ kiến thức Toán 10, rèn luyện kỹ năng thực chiến giải đề.',
      'Tối ưu hóa thời gian làm bài, nhận diện và tránh các bẫy thường gặp trong đề thi.'
    ],
    program: [
      'Bộ đề thực chiến được thiết kế bám sát cấu trúc đề thi mới nhất.'
    ],
    quantity: 'Bộ đề thực chiến 2k10',
    curriculum: [
      {
        title: 'Tuần 1: Tổng ôn kiến thức nền tảng và kỹ năng giải đề trắc nghiệm.',
        lessons: [
          { title: '1.1 Rà soát kiến thức trọng tâm đầu cấp', duration: '40:00', type: 'video' },
          { title: 'Đề luyện tập tổng hợp số 1', type: 'document' }
        ]
      },
      { title: 'Tuần 2: Chiến thuật xử lý nhanh các câu hỏi Đại số và Hàm số.', lessons: [] },
      { title: 'Tuần 3: Kỹ thuật giải nhanh trắc nghiệm Hình học phẳng.', lessons: [] },
      { title: 'Tuần 4: Luyện đề chuyên đề: Vectơ và Hệ thức lượng.', lessons: [] },
      { title: 'Tuần 5: Luyện đề chuyên đề: Thống kê và Xác suất.', lessons: [] },
      { title: 'Tuần 6: Thực chiến đề thi học kỳ các trường chuyên.', lessons: [] },
      { title: 'Tuần 7: Giải chi tiết bộ đề tinh hoa Toán 10.', lessons: [] },
      { title: 'Tuần 8: Kỹ năng sử dụng máy tính Casio trong chương trình mới.', lessons: [] },
      { title: 'Tuần 9: Phân tích cấu trúc đề thi định hướng 2028.', lessons: [] },
      { title: 'Tuần 10: Đề dự đoán số 1 Toán 10.', lessons: [] },
      { title: 'Tuần 11: Đề dự đoán số 2 Toán 10.', lessons: [] },
      { title: 'Tuần 12: Tổng kết khóa học và định hướng lộ trình lớp 11.', lessons: [] }
    ]
  }
};
