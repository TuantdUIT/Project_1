import type { Exam, ResExamGroup, ResStandaloneQuestion } from '../types';
import type { ReqExamQuestion, ReqExamQuestionGroup } from '../types';

export const QUESTION_TYPES = ['MCQ', 'SAQ', 'TFQ'] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type TypeScoreConfig = Record<QuestionType, number | null>;

export const DEFAULT_TYPE_SCORE: TypeScoreConfig = {
  MCQ: 1,
  SAQ: 1,
  TFQ: 1,
};

function commonScore(scores: number[]): number | null {
  if (scores.length === 0) return null;
  return scores.every((score) => score === scores[0]) ? scores[0] : null;
}

export function getStandaloneQuestions(exam: Exam): ResStandaloneQuestion[] {
  return (exam.questionSections ?? [])
    .flatMap((section) => section.standaloneQuestions ?? [])
    .sort((a, b) => (a.questionOrder ?? 0) - (b.questionOrder ?? 0));
}

export function getExamGroups(exam: Exam): ResExamGroup[] {
  return (exam.questionSections ?? []).flatMap((section) => section.groups ?? []);
}

export function inferTypeScore(exam: Exam): TypeScoreConfig {
  const questions = getStandaloneQuestions(exam);
  const groups = getExamGroups(exam);

  return Object.fromEntries(
    QUESTION_TYPES.map((type) => [
      type,
      commonScore([
        ...questions
          .filter((question) => question.sectionType === type && question.score != null)
          .map((question) => question.score!),
        ...groups
          .filter((group) => group.questionType === type && group.scorePerQuestion != null)
          .map((group) => group.scorePerQuestion!),
      ]),
    ]),
  ) as TypeScoreConfig;
}

export function scoreForType(typeScore: TypeScoreConfig, type?: string | null, fallback = 1): number {
  if (type && type in typeScore) {
    return typeScore[type as QuestionType] ?? fallback;
  }
  return fallback;
}

export function calculateExamTotalScore(
  questions: ReqExamQuestion[],
  groups: ReqExamQuestionGroup[],
): number {
  const standaloneScore = questions.reduce((total, question) => total + question.score, 0);
  const groupScore = groups.reduce(
    (total, group) => total + group.pickQuestionCount * group.scorePerQuestion,
    0,
  );

  return Math.round((standaloneScore + groupScore) * 100) / 100;
}
