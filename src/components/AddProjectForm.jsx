
import { useState } from 'react';
import { useSupabase } from './SupabaseProvider';

export default function AddProjectForm({ userProfiles, onProjectAdded }) {
  const supabase = useSupabase();
  const [projectName, setProjectName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName || !selectedUserId) {
      setError('프로젝트 이름과 담당 센터를 모두 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          user_id: selectedUserId,
          status: 'script_needed', // Default status
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setSuccess(`'${projectName}' 프로젝트가 성공적으로 추가되었습니다.`);
      setProjectName('');
      setSelectedUserId('');
      if (onProjectAdded) {
        onProjectAdded(data);
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError(`프로젝트 추가 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-8 md:mt-0">
      <h2 className="text-2xl font-bold mb-4 text-white">새 프로젝트 추가</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-1">
            프로젝트 이름
          </label>
          <input
            type="text"
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="예: 2025년 2분기 홍보 영상"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="userProfile" className="block text-sm font-medium text-gray-300 mb-1">
            담당 센터
          </label>
          <select
            id="userProfile"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="" disabled>센터를 선택하세요</option>
            {(userProfiles || []).map((profile) => (
              <option key={profile.user_id} value={profile.user_id}>
                {profile.member_name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500"
        >
          {isLoading ? '추가하는 중...' : '프로젝트 추가'}
        </button>
      </form>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {success && <p className="text-green-500 mt-4">{success}</p>}
    </div>
  );
}
