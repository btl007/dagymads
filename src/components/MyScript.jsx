import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabase } from './SupabaseProvider';
import { PlusCircle } from 'lucide-react';

// Helper function to extract plain text from Lexical JSON state for a preview
// Helper function to extract plain text from Lexical JSON state for a preview
const extractTextFromLexical = (json) => {
  let text = '';
  try {
    if (json && json.root && json.root.children) {
      for (const child of json.root.children) {
        if (child.children) {
          for (const innerChild of child.children) {
            if (innerChild.type === 'text') {
              text += innerChild.text + ' ';
            }
          }
        }
        if (text.length > 100) break; // Stop early if we have enough text for a preview
      }
    }
  } catch (e) {
    console.error("Failed to parse Lexical content for preview", e);
    return "(미리보기를 생성할 수 없습니다)";
  }
  return text.trim();
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusMap = {
    draft: { text: '임시저장', className: 'bg-slate-600 text-slate-200' },
    submitted: { text: '접수됨', className: 'bg-blue-600 text-blue-100' },
    under_review: { text: '검토 중', className: 'bg-yellow-500 text-yellow-100' },
    approved: { text: '승인됨', className: 'bg-green-500 text-green-100' },
  };

  const currentStatus = statusMap[status] || statusMap.draft;

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${currentStatus.className}`}>
      {currentStatus.text}
    </span>
  );
};

const MyScript = ({ handleNavigate }) => {
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scripts, setScripts] = useState([]);

  useEffect(() => {
    if (!supabase) return;

    const fetchScripts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('scripts')
          .select('id, title, content, updated_at, status')
          .order('updated_at', { ascending: false });

        if (error) {
          throw error;
        }
        setScripts(data);
      } catch (err) {
        console.error('Error fetching scripts:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScripts();
  }, [supabase]);

  const handleDelete = async (scriptId) => {
    if (window.confirm('정말로 이 대본을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', scriptId);

      if (error) {
        console.error('Error deleting script:', error);
        alert(`삭제에 실패했습니다: ${error.message}`);
      } else {
        setScripts(scripts.filter(script => script.id !== scriptId));
        alert('대본이 삭제되었습니다.');
      }
    }
  };

  if (isLoading) {
    return <div className="p-4 text-white">목록을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">오류가 발생했습니다: {error.message}</div>;
  }

  return (
    <div className="p-1">
      {scripts.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold text-white">아직 작성한 대본이 없습니다.</h3>
          <p className="text-gray-400 mb-6">새로운 대본을 작성해보세요.</p>
          <Link
            to="/editor"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            새 대본 작성하기
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {scripts.map(script => {
            const preview = extractTextFromLexical(script.content).substring(0, 80);
            return (
              <li key={script.id} className="p-4 rounded-lg bg-slate-800 border border-slate-700 text-white shadow-md transition-all hover:border-slate-600">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-base text-slate-200 truncate w-48">{script.title}</h4>
                  <StatusBadge status={script.status || 'draft'} />
                </div>
                <p className="text-sm text-slate-400 my-2 h-10 overflow-hidden">
                  {preview || '(내용 없음)'}
                </p>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-500">
                      수정: {new Date(script.updated_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handleNavigate(script.id)} className="px-3 py-1 text-sm bg-slate-600 hover:bg-slate-500 rounded-md transition-colors">
                            수정
                        </button>
                        <button onClick={() => handleDelete(script.id)} className="px-3 py-1 text-sm bg-red-800 hover:bg-red-700 rounded-md transition-colors">
                            삭제
                        </button>
                    </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MyScript;
