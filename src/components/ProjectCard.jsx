import React from 'react';

const ProjectCard = ({ project, userName, onUpdateStatus, onCenterClick }) => {

  const handleStatusChange = (newStatus) => {
    if (window.confirm(`프로젝트 상태를 '${newStatus}'(으)로 변경하시겠습니까?`)) {
      onUpdateStatus(project.id, newStatus);
    }
  };

  // --- Date & Days Calculation ---
  const createdAt = new Date(project.created_at);
  const year = createdAt.getFullYear().toString().slice(-2);
  const month = createdAt.getMonth() + 1;
  const formattedDate = `${year}년 ${month}월`;

  const daysSinceCreation = Math.floor((new Date() - createdAt) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700 flex flex-col">
      {/* Top Section: Center and Project Name */}
      <div 
        className="cursor-pointer hover:text-blue-400 transition-colors" 
        onClick={() => onCenterClick(project.user_id)}
        title="상세 조회에서 센터 정보 보기"
      >
        <h3 className="font-bold text-lg text-white truncate">{userName || project.user_id}</h3>
        <p className="text-sm text-slate-400 mb-3 truncate">{project.name}</p>
      </div>

      {/* Middle Section: Link */}
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

      {/* Spacer to push content to bottom */}
      <div className="flex-grow"></div>

      {/* Bottom Section: Date Badges & Status Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between mb-3">
            <span className="px-2 py-1 text-xs font-semibold text-white rounded-md bg-orange-600">
                {formattedDate}
            </span>
            <span className="text-xs text-slate-400">
                센터 등록으로부터 +{daysSinceCreation}일
            </span>
        </div>

        {project.status !== 'script_needed' && (
          <div className="flex space-x-2">
            <button 
              onClick={() => handleStatusChange('video_draft_1')}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded w-full"
            >
              초안 전달
            </button>
            <button 
              onClick={() => handleStatusChange('project_complete')}
              className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 rounded w-full"
            >
              완료
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;