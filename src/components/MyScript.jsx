import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabase } from './SupabaseProvider';
import { PlusCircle } from 'lucide-react';

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
          .select('id, title, content, updated_at')
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
        <ul className="space-y-3">
          {scripts.map(script => {
            const preview = extractTextFromLexical(script.content).substring(0, 80);
            return (
              <li key={script.id} className="p-4 border border-gray-700 rounded-lg bg-gray-800 text-white">
                <h4 className="font-bold text-lg text-blue-400 truncate">{script.title}</h4>
                <p className="text-sm text-gray-300 my-2 truncate">
                  {preview || '(내용 없음)'}
                </p>
                <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-gray-500">
                        수정: {new Date(script.updated_at).toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handleNavigate(script.id)} className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded-md">
                            수정하기
                        </button>
                        <button onClick={() => handleDelete(script.id)} className="px-3 py-1 text-sm bg-red-700 hover:bg-red-600 rounded-md">
                            삭제하기
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
