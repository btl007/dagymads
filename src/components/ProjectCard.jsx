import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { STATUS_MAP } from '../data/projectStatuses'; // Correctly import STATUS_MAP

// Helper function to get status display properties
const getStatusInfo = (status) => {
  const info = {
    label: STATUS_MAP.get(status) || '알 수 없음',
    color: '#6B7280', // Default color (gray)
  };

  switch (status) {
    case 'project_open':
      info.color = '#3B82F6'; // Blue
      break;
    case 'script_needed':
      info.color = '#EF4444'; // Red
      break;
    case 'script_submitted':
      info.color = '#F59E0B'; // Amber
      break;
    case 'project_complete':
      info.color = '#10B981'; // Green
      break;
    case 'project_pending':
    case 'project_cancled':
      info.color = '#4B5563'; // Dark Gray
      break;
    default:
      break;
  }
  return info;
};


function ProjectCard({ project, managerName, onClick }) {
  const statusInfo = getStatusInfo(project.status);

  return (
    <Card 
      onClick={onClick} 
      className="cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-200"
    >
      <CardHeader>
        <CardTitle className="text-lg font-bold truncate">{project.project_name || 'Untitled Project'}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">상태:</span>
          <Badge style={{ backgroundColor: statusInfo.color, color: 'white' }}>
            {statusInfo.label}
          </Badge>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">담당자:</span>
          <span>{managerName || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold">생성일:</span>
          <span>
            {project.created_at 
              ? format(parseISO(project.created_at), 'yyyy-MM-dd')
              : 'N/A'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProjectCard;