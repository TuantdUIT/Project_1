import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  LearningFile,
  OnlineLecture,
  ReqCreateLearningFileDTO,
  ReqCreateOnlineLectureDTO,
  ReqUpdateLearningFileDTO,
  ReqUpdateOnlineLectureDTO,
} from '@/features/Management_Services/learning-resource/types';

const ONLINE_LECTURES_BASE = '/api/v1/online-lectures';
const LEARNING_FILES_BASE = '/api/v1/learning-files';

const onlineLecturesKey = ['learning-resources', 'online-lectures'] as const;
const learningFilesKey = ['learning-resources', 'learning-files'] as const;

export function getOnlineLectures() {
  return apiClient.get<OnlineLecture[]>(ONLINE_LECTURES_BASE);
}

export function getLearningFiles() {
  return apiClient.get<LearningFile[]>(LEARNING_FILES_BASE);
}

export function createOnlineLecture(body: ReqCreateOnlineLectureDTO) {
  return apiClient.post<OnlineLecture>(ONLINE_LECTURES_BASE, body);
}

export function updateOnlineLecture(lectureUuid: string, body: ReqUpdateOnlineLectureDTO) {
  return apiClient.put<OnlineLecture>(`${ONLINE_LECTURES_BASE}/${lectureUuid}`, body);
}

export function deleteOnlineLecture(lectureUuid: string) {
  return apiClient.delete<void>(`${ONLINE_LECTURES_BASE}/${lectureUuid}`);
}

export function createLearningFile(body: ReqCreateLearningFileDTO) {
  return apiClient.post<LearningFile>(LEARNING_FILES_BASE, body);
}

export function updateLearningFile(fileUuid: string, body: ReqUpdateLearningFileDTO) {
  return apiClient.put<LearningFile>(`${LEARNING_FILES_BASE}/${fileUuid}`, body);
}

export function deleteLearningFile(fileUuid: string) {
  return apiClient.delete<void>(`${LEARNING_FILES_BASE}/${fileUuid}`);
}

export function useOnlineLecturesQuery() {
  return useQuery({
    queryKey: onlineLecturesKey,
    queryFn: getOnlineLectures,
  });
}

export function useLearningFilesQuery() {
  return useQuery({
    queryKey: learningFilesKey,
    queryFn: getLearningFiles,
  });
}

export function useCreateOnlineLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOnlineLecture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onlineLecturesKey });
    },
  });
}

export function useUpdateOnlineLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lectureUuid, body }: { lectureUuid: string; body: ReqUpdateOnlineLectureDTO }) =>
      updateOnlineLecture(lectureUuid, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onlineLecturesKey });
    },
  });
}

export function useDeleteOnlineLecture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOnlineLecture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onlineLecturesKey });
    },
  });
}

export function useCreateLearningFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLearningFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningFilesKey });
    },
  });
}

export function useUpdateLearningFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileUuid, body }: { fileUuid: string; body: ReqUpdateLearningFileDTO }) =>
      updateLearningFile(fileUuid, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningFilesKey });
    },
  });
}

export function useDeleteLearningFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLearningFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningFilesKey });
    },
  });
}
