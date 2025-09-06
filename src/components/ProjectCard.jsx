import React from 'react';

const ProjectCard = ({ project, userName, onUpdateStatus }) => {
  const handleStatusChange = (newStatus) => {
    if (window.confirm(`프로젝트 상태를 '${newStatus}'(으)로 변경하시겠습니까?`)) {
      onUpdateStatus(project.id, newStatus);
    }
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700">
      <h4 className="font-bold text-white truncate">{project.name}</h4>
      <p className="text-sm text-slate-400 mb-3">{userName || project.user_id}</p>
      
      {project.frame_io_link && (
        <a 
          href={project.frame_io_link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:underline mb-3 block"
        >
          Frame.io 링크 보기
        </a>
      )}

      <div className="mt-4 pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-500 mb-2">상태: {project.status}</p>
        <div className="flex space-x-2">
          {/* 여기에 상태 변경 버튼들을 추가할 수 있습니다. */}
          {/* 예시: */}
          <button 
            onClick={() => handleStatusChange('video_draft_1')}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded"
          >
            초안 전달
          </button>
          <button 
            onClick={() => handleStatusChange('project_complete')}
            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 rounded"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
