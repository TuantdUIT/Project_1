// Dữ liệu cho bảng chèn công thức tùy biến (Symbol + Formula).
// - `display`: LaTeX hiển thị trên nút (phải hợp lệ khi render độc lập bằng KaTeX).
// - `insert` : LaTeX chèn vào nội dung. Dùng `{}` cho mỗi "ô trống" để đặt con trỏ.

export interface PaletteItem {
  display: string;
  insert: string;
  title: string;
}

export interface PaletteGroup {
  label: string;
  items: PaletteItem[];
}

// ── Tab 1: Ký hiệu ───────────────────────────────────────────────────────────
export const SYMBOL_GROUPS: PaletteGroup[] = [
  {
    label: 'Cơ bản',
    items: [
      { display: '\\pm', insert: '\\pm', title: 'Cộng trừ' },
      { display: '\\mp', insert: '\\mp', title: 'Trừ cộng' },
      { display: '\\times', insert: '\\times', title: 'Nhân' },
      { display: '\\div', insert: '\\div', title: 'Chia' },
      { display: '\\cdot', insert: '\\cdot', title: 'Nhân chấm' },
      { display: '=', insert: '=', title: 'Bằng' },
      { display: '\\ne', insert: '\\ne', title: 'Khác' },
      { display: '\\approx', insert: '\\approx', title: 'Xấp xỉ' },
      { display: '\\equiv', insert: '\\equiv', title: 'Đồng dư' },
      { display: '\\cong', insert: '\\cong', title: 'Đồng dạng' },
      { display: '\\sim', insert: '\\sim', title: 'Tương tự' },
      { display: '\\propto', insert: '\\propto', title: 'Tỉ lệ' },
      { display: '<', insert: '<', title: 'Nhỏ hơn' },
      { display: '>', insert: '>', title: 'Lớn hơn' },
      { display: '\\le', insert: '\\le', title: 'Nhỏ hơn hoặc bằng' },
      { display: '\\ge', insert: '\\ge', title: 'Lớn hơn hoặc bằng' },
      { display: '\\ll', insert: '\\ll', title: 'Nhỏ hơn nhiều' },
      { display: '\\gg', insert: '\\gg', title: 'Lớn hơn nhiều' },
      { display: '\\infty', insert: '\\infty', title: 'Vô cực' },
      { display: '\\forall', insert: '\\forall', title: 'Với mọi' },
    ],
  },
  {
    label: 'Tập hợp & Logic',
    items: [
      { display: '\\in', insert: '\\in', title: 'Thuộc' },
      { display: '\\notin', insert: '\\notin', title: 'Không thuộc' },
      { display: '\\ni', insert: '\\ni', title: 'Chứa' },
      { display: '\\subset', insert: '\\subset', title: 'Tập con' },
      { display: '\\subseteq', insert: '\\subseteq', title: 'Tập con hoặc bằng' },
      { display: '\\supset', insert: '\\supset', title: 'Tập cha' },
      { display: '\\cup', insert: '\\cup', title: 'Hợp' },
      { display: '\\cap', insert: '\\cap', title: 'Giao' },
      { display: '\\emptyset', insert: '\\emptyset', title: 'Tập rỗng' },
      { display: '\\exists', insert: '\\exists', title: 'Tồn tại' },
      { display: '\\nexists', insert: '\\nexists', title: 'Không tồn tại' },
      { display: '\\wedge', insert: '\\wedge', title: 'Và' },
      { display: '\\vee', insert: '\\vee', title: 'Hoặc' },
      { display: '\\neg', insert: '\\neg', title: 'Phủ định' },
      { display: '\\Rightarrow', insert: '\\Rightarrow', title: 'Suy ra' },
      { display: '\\Leftrightarrow', insert: '\\Leftrightarrow', title: 'Tương đương' },
      { display: '\\therefore', insert: '\\therefore', title: 'Do đó' },
      { display: '\\because', insert: '\\because', title: 'Vì' },
    ],
  },
  {
    label: 'Hy Lạp',
    items: [
      { display: '\\alpha', insert: '\\alpha', title: 'alpha' },
      { display: '\\beta', insert: '\\beta', title: 'beta' },
      { display: '\\gamma', insert: '\\gamma', title: 'gamma' },
      { display: '\\delta', insert: '\\delta', title: 'delta' },
      { display: '\\varepsilon', insert: '\\varepsilon', title: 'epsilon' },
      { display: '\\zeta', insert: '\\zeta', title: 'zeta' },
      { display: '\\eta', insert: '\\eta', title: 'eta' },
      { display: '\\theta', insert: '\\theta', title: 'theta' },
      { display: '\\lambda', insert: '\\lambda', title: 'lambda' },
      { display: '\\mu', insert: '\\mu', title: 'mu' },
      { display: '\\nu', insert: '\\nu', title: 'nu' },
      { display: '\\xi', insert: '\\xi', title: 'xi' },
      { display: '\\pi', insert: '\\pi', title: 'pi' },
      { display: '\\rho', insert: '\\rho', title: 'rho' },
      { display: '\\sigma', insert: '\\sigma', title: 'sigma' },
      { display: '\\tau', insert: '\\tau', title: 'tau' },
      { display: '\\varphi', insert: '\\varphi', title: 'phi' },
      { display: '\\psi', insert: '\\psi', title: 'psi' },
      { display: '\\omega', insert: '\\omega', title: 'omega' },
      { display: '\\Delta', insert: '\\Delta', title: 'Delta' },
      { display: '\\Sigma', insert: '\\Sigma', title: 'Sigma' },
      { display: '\\Omega', insert: '\\Omega', title: 'Omega' },
    ],
  },
  {
    label: 'Mũi tên & Khác',
    items: [
      { display: '\\leftarrow', insert: '\\leftarrow', title: 'Trái' },
      { display: '\\rightarrow', insert: '\\rightarrow', title: 'Phải' },
      { display: '\\uparrow', insert: '\\uparrow', title: 'Lên' },
      { display: '\\downarrow', insert: '\\downarrow', title: 'Xuống' },
      { display: '\\leftrightarrow', insert: '\\leftrightarrow', title: 'Hai chiều' },
      { display: '\\mapsto', insert: '\\mapsto', title: 'Ánh xạ' },
      { display: '\\partial', insert: '\\partial', title: 'Đạo hàm riêng' },
      { display: '\\nabla', insert: '\\nabla', title: 'Nabla' },
      { display: '{}^\\circ', insert: '^\\circ', title: 'Độ' },
      { display: '\\%', insert: '\\%', title: 'Phần trăm' },
      { display: "{}'", insert: "'", title: 'Phẩy' },
      { display: '\\cdots', insert: '\\cdots', title: 'Ba chấm ngang' },
      { display: '\\vdots', insert: '\\vdots', title: 'Ba chấm dọc' },
      { display: '\\ddots', insert: '\\ddots', title: 'Ba chấm chéo' },
      { display: '\\ldots', insert: '\\ldots', title: 'Ba chấm dưới' },
    ],
  },
];

// ── Tab 2: Công thức ─────────────────────────────────────────────────────────
export const FORMULA_GROUPS: PaletteGroup[] = [
  {
    label: 'Phân số',
    items: [
      { display: '\\frac{a}{b}', insert: '\\frac{}{}', title: 'Phân số' },
      { display: '\\dfrac{a}{b}', insert: '\\dfrac{}{}', title: 'Phân số lớn' },
      { display: '{}^{a}/_{b}', insert: '{}^{}/_{}', title: 'Phân số chéo' },
    ],
  },
  {
    label: 'Lũy thừa & Chỉ số',
    items: [
      { display: 'a^{b}', insert: '{}^{}', title: 'Lũy thừa' },
      { display: 'a_{b}', insert: '{}_{}', title: 'Chỉ số dưới' },
      { display: 'a_{b}^{c}', insert: '{}_{}^{}', title: 'Chỉ số trên & dưới' },
    ],
  },
  {
    label: 'Căn',
    items: [
      { display: '\\sqrt{a}', insert: '\\sqrt{}', title: 'Căn bậc hai' },
      { display: '\\sqrt[3]{a}', insert: '\\sqrt[3]{}', title: 'Căn bậc ba' },
      { display: '\\sqrt[n]{a}', insert: '\\sqrt[]{}', title: 'Căn bậc n' },
    ],
  },
  {
    label: 'Tích phân',
    items: [
      { display: '\\int', insert: '\\int', title: 'Tích phân' },
      { display: '\\int_{a}^{b}', insert: '\\int_{}^{}', title: 'Tích phân xác định' },
      { display: '\\iint', insert: '\\iint', title: 'Tích phân kép' },
      { display: '\\oint', insert: '\\oint', title: 'Tích phân đường' },
    ],
  },
  {
    label: 'Tổng & Tích',
    items: [
      { display: '\\sum_{i=1}^{n}', insert: '\\sum_{}^{}', title: 'Tổng' },
      { display: '\\prod_{i=1}^{n}', insert: '\\prod_{}^{}', title: 'Tích' },
      { display: '\\bigcup', insert: '\\bigcup', title: 'Hợp lớn' },
      { display: '\\bigcap', insert: '\\bigcap', title: 'Giao lớn' },
    ],
  },
  {
    label: 'Ngoặc',
    items: [
      { display: '\\left(a\\right)', insert: '\\left({}\\right)', title: 'Ngoặc tròn' },
      { display: '\\left[a\\right]', insert: '\\left[{}\\right]', title: 'Ngoặc vuông' },
      { display: '\\left\\{a\\right\\}', insert: '\\left\\{{}\\right\\}', title: 'Ngoặc nhọn' },
      { display: '\\left|a\\right|', insert: '\\left|{}\\right|', title: 'Trị tuyệt đối' },
    ],
  },
  {
    label: 'Hàm',
    items: [
      { display: '\\sin', insert: '\\sin\\left({}\\right)', title: 'sin' },
      { display: '\\cos', insert: '\\cos\\left({}\\right)', title: 'cos' },
      { display: '\\tan', insert: '\\tan\\left({}\\right)', title: 'tan' },
      { display: '\\cot', insert: '\\cot\\left({}\\right)', title: 'cot' },
      { display: '\\ln', insert: '\\ln\\left({}\\right)', title: 'ln' },
      { display: '\\exp', insert: '\\exp\\left({}\\right)', title: 'exp' },
    ],
  },
  {
    label: 'Giới hạn & Log',
    items: [
      { display: '\\lim_{x\\to a}', insert: '\\lim_{{}\\to{}}', title: 'Giới hạn' },
      { display: '\\log_{a}b', insert: '\\log_{}\\left({}\\right)', title: 'Log cơ số a' },
      { display: '\\log', insert: '\\log\\left({}\\right)', title: 'Log thập phân' },
      { display: '\\ln', insert: '\\ln\\left({}\\right)', title: 'Log tự nhiên' },
    ],
  },
  {
    label: 'Dấu',
    items: [
      { display: '\\hat{a}', insert: '\\hat{}', title: 'Mũ' },
      { display: '\\bar{a}', insert: '\\bar{}', title: 'Gạch ngang' },
      { display: '\\vec{a}', insert: '\\vec{}', title: 'Vectơ' },
      { display: '\\dot{a}', insert: '\\dot{}', title: 'Chấm' },
      { display: '\\tilde{a}', insert: '\\tilde{}', title: 'Ngã' },
      { display: '\\overline{abc}', insert: '\\overline{}', title: 'Gạch trên dài' },
    ],
  },
  {
    label: 'Ma trận',
    items: [
      {
        display: '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}',
        insert: '\\begin{pmatrix}{}&{}\\\\{}&{}\\end{pmatrix}',
        title: 'Ma trận ngoặc tròn',
      },
      {
        display: '\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}',
        insert: '\\begin{bmatrix}{}&{}\\\\{}&{}\\end{bmatrix}',
        title: 'Ma trận ngoặc vuông',
      },
      {
        display: '\\begin{vmatrix}a&b\\\\c&d\\end{vmatrix}',
        insert: '\\begin{vmatrix}{}&{}\\\\{}&{}\\end{vmatrix}',
        title: 'Định thức',
      },
    ],
  },
];
