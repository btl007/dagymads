export const PROJECT_STATUSES = [
  { id: 'project_open', title: '프로젝트 오픈' },
  { id: 'script_needed', title: '대본 필요' },
  { id: 'script_submitted', title: '대본 접수' },
  { id: 'schedule_submitted', title: '일정 접수' },
  { id: 'schedule_under_review', title: '일정 검토중' },
  { id: 'schedule_fixed', title: '일정 확정' },
  { id: 'shoot_completed', title: '촬영 완료' },
  { id: 'video_draft_1', title: '영상 초안' },
  { id: 'feedback_complete', title: '피드백 완료' },
  { id: 'video_edit_uploaded', title: '편집본 업로드' },
  { id: 'project_complete', title: '최종 완료' },
  { id: 'project_pending', title: '프로젝트 보류' },
  { id: 'project_cancled', title: '프로젝트 취소' },
  // Script specific statuses
  { id: 'submitted', title: '접수됨' },
  { id: 'under_review', title: '검토 중' },
  { id: 'approved', title: '승인됨' },
  { id: 'draft', title: '임시저장' },
];

export const STATUS_MAP = new Map(
  PROJECT_STATUSES.map(status => [status.id, status.title])
);
