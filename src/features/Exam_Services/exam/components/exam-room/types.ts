export type QType = 'MCQ' | 'TFQ' | 'SAQ';

export type MCQOption = { optionKey: string; optionContent: string };

export type GroupOrigin = {
  groupName: string;
  questionTopic: string;
  itemIndex: number;
  groupSize: number;
};

export type StandaloneQ = {
  kind: 'standalone';
  globalIndex: number;
  questionType: QType;
  questionUuid: string;
  questionContent: string;
  score: number;
  groupOrigin?: GroupOrigin;
  mcOptions?: MCQOption[];
};

export type GroupQ = {
  kind: 'group';
  globalIndex: number;
  questionType: 'TFQ' | 'SAQ';
  questionUuid: string;
  groupName: string;
  questionTopic: string;
  scorePerQuestion: number;
  items: { questionUuid: string; questionContent: string }[];
};

export type FlatQ = StandaloneQ | GroupQ;

export type GroupAnswer = Record<string, boolean | string>;
export type AnswerValue = string | boolean | GroupAnswer;
export type AnswerMap = Record<number, AnswerValue>;

export function isQuestionAnswered(q: FlatQ, answers: AnswerMap): boolean {
  const ans = answers[q.globalIndex];
  if (ans === undefined || ans === null) return false;
  if (q.kind === 'group') {
    const ga = ans as GroupAnswer;
    return q.items.length > 0 && q.items.every((item) => ga[item.questionUuid] !== undefined);
  }
  return true;
}
