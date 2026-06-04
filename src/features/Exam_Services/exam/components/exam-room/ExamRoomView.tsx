import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Clock, CheckCircle2, LayoutList, PenLine, ShieldAlert, Loader2 } from 'lucide-react';
import type { Exam } from '@/features/Exam_Services/exam/types';
import type { ProctoringEventType } from '@/features/Exam_Services/proctoring';
import type { FlatQ, AnswerMap, AnswerValue, QType, StandaloneQ } from './types';
import { isQuestionAnswered } from './types';
import { MCQCard } from './MCQCard';
import { TFQCard } from './TFQCard';
import { SAQCard } from './SAQCard';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const VIOLATION_MESSAGE: Record<ProctoringEventType, string> = {
  TAB_SWITCH:      'Bạn vừa chuyển tab!',
  FULLSCREEN_EXIT: 'Bạn vừa thoát toàn màn hình!',
  WINDOW_BLUR:     'Bạn vừa rời khỏi cửa sổ thi!',
  COPY_PASTE:      'Phát hiện hành vi sao chép!',
  NETWORK_LOST:    'Mất kết nối mạng!',
};

const TAB_CONFIG: Record<QType, { label: string; Icon: React.ElementType }> = {
  MCQ: { label: 'Trắc nghiệm', Icon: LayoutList },
  TFQ: { label: 'Đúng / Sai',  Icon: CheckCircle2 },
  SAQ: { label: 'Trả lời ngắn', Icon: PenLine },
};

interface Props {
  exam: Exam;
  flatQuestions: FlatQ[];
  answers: AnswerMap;
  timeLeft: number;
  onAnswer: (globalIndex: number, value: AnswerValue) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  lastViolation?: { type: ProctoringEventType; key: number } | null;
}

export function ExamRoomView({ exam, flatQuestions, answers, timeLeft, onAnswer, onSubmit, isSubmitting, lastViolation }: Props) {
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!lastViolation) return;
    setToastVisible(true);
    const t = setTimeout(() => setToastVisible(false), 3000);
    return () => clearTimeout(t);
  }, [lastViolation?.key]);
  const sectionGroups = useMemo(() => {
    const map: Record<QType, FlatQ[]> = { MCQ: [], TFQ: [], SAQ: [] };
    for (const q of flatQuestions) map[q.questionType].push(q);
    return map;
  }, [flatQuestions]);

  const availableTabs = useMemo(
    () => (['MCQ', 'TFQ', 'SAQ'] as QType[]).filter((t) => sectionGroups[t].length > 0),
    [sectionGroups],
  );

  const [activeTab, setActiveTab] = useState<QType>(availableTabs[0] ?? 'MCQ');
  const [activeQuestion, setActiveQuestion] = useState<number>(0);

  // Đồng bộ tab khi câu hỏi load xong (availableTabs thay đổi từ [] → [...])
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll và active question khi đổi tab
  useEffect(() => {
    const qs = sectionGroups[activeTab];
    if (qs.length > 0) {
      setActiveQuestion(qs[0].globalIndex);
      scrollRef.current?.scrollTo({ top: 0 });
    }
  }, [activeTab]);

  const currentQuestions = sectionGroups[activeTab];

  const answeredCount = useMemo(
    () => flatQuestions.filter((q) => isQuestionAnswered(q, answers)).length,
    [flatQuestions, answers],
  );

  const questionRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // IntersectionObserver — cập nhật pill active khi cuộn
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || currentQuestions.length === 0) return;
    const observers: IntersectionObserver[] = [];
    currentQuestions.forEach((q) => {
      const el = questionRefs.current.get(q.globalIndex);
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => { if (entries[0].isIntersecting) setActiveQuestion(q.globalIndex); },
        { root: container, threshold: 0.3 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [currentQuestions]);

  function scrollToQuestion(globalIndex: number) {
    setActiveQuestion(globalIndex);
    questionRefs.current.get(globalIndex)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
    <AnimatePresence>
      {toastVisible && lastViolation && (
        <motion.div
          key={lastViolation.key}
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2.5 bg-amber-500 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-lg shadow-amber-200"
        >
          <ShieldAlert size={16} className="shrink-0" />
          {VIOLATION_MESSAGE[lastViolation.type]}
        </motion.div>
      )}
    </AnimatePresence>

    <div className="fixed inset-0 z-[60] bg-gray-50 flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <FileText className="text-indigo-600" size={20} />
          <span className="text-sm font-black text-slate-800 uppercase tracking-wide">
            {exam.examName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-indigo-600">
          <Clock size={18} />
          <span className="text-lg font-black tabular-nums">{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* ── Tab bar + Pills ── */}
      <div className="bg-white border-b border-gray-200 shrink-0">

        {/* Tabs */}
        <div className="flex">
          {availableTabs.map((tab) => {
            const { label, Icon } = TAB_CONFIG[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Question pills */}
        <div className="flex items-center gap-2 px-6 py-3 overflow-x-auto">
          {currentQuestions.map((q, i) => {
            const answered = isQuestionAnswered(q, answers);
            const isActive = activeQuestion === q.globalIndex;
            return (
              <button
                key={q.globalIndex}
                onClick={() => scrollToQuestion(q.globalIndex)}
                className={`w-9 h-9 rounded-lg text-sm font-bold shrink-0 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : answered
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Question list ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-5 pb-10">
          {currentQuestions.length === 0 && (
            <div className="flex justify-center items-center py-20 text-slate-400 text-sm font-medium">
              Đang tải câu hỏi...
            </div>
          )}
          {currentQuestions.map((q, i) => (
            <div
              key={q.globalIndex}
              ref={(el) => {
                if (el) questionRefs.current.set(q.globalIndex, el);
                else questionRefs.current.delete(q.globalIndex);
              }}
              className="scroll-mt-4"
            >
              {q.questionType === 'MCQ' && q.kind === 'standalone' && (
                <MCQCard q={q} displayIndex={i + 1} answers={answers} onChange={onAnswer} />
              )}
              {q.questionType === 'TFQ' && (
                <TFQCard
                  q={q as FlatQ & { questionType: 'TFQ' }}
                  displayIndex={i + 1}
                  answers={answers}
                  onChange={onAnswer}
                />
              )}
              {q.questionType === 'SAQ' && (
                <SAQCard
                  q={q as FlatQ & { questionType: 'SAQ' }}
                  displayIndex={i + 1}
                  answers={answers}
                  onChange={onAnswer}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <span className="text-sm text-slate-500 font-medium">
          {answeredCount}/{flatQuestions.length} câu đã trả lời
        </span>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-8 py-2.5 rounded-xl transition-colors"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài'}
        </button>
      </div>

    </div>
    </>
  );
}
