// src/pages/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../components/SupabaseProvider';

const UserProfile = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useSupabase();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [memberName, setMemberName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !supabase) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('user_profiles')
          .select('phone_number, member_name')
          .filter('user_id', 'eq', user.id) // Use filter instead of rpc
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "no rows found"
          throw fetchError;
        }

        if (data) {
          setPhoneNumber(data.phone_number || '');
          setMemberName(data.member_name || '');
        } else {
          // If no profile exists, it means the App.jsx checkAndCreateProfile didn't run yet or failed
          // We can create a basic one here if needed, but App.jsx should handle initial creation
          console.warn('User profile not found on load. App.jsx should have created it.');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isLoaded, isSignedIn, supabase, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!supabase || !user || !isLoaded || !isSignedIn) return;

    setIsSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          phone_number: phoneNumber,
          member_name: memberName,
          updated_at: new Date(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }
      alert('프로필이 성공적으로 업데이트되었습니다!');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err);
      alert(`프로필 저장에 실패했습니다: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return <div className="p-8 text-center">로그인 후 이용해주세요.</div>;
  }

  if (isLoading) {
    return <div className="p-8 text-center">프로필 로딩 중...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500 text-center">오류 발생: {error.message}</div>;
  }

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center">내 프로필</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">사용자 이름 (Clerk):</label>
          <input
            type="text"
            id="username"
            value={user.username || user.firstName || user.id}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 cursor-not-allowed"
            disabled
          />
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">전화번호:</label>
          <input
            type="text"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="memberName" className="block text-sm font-medium text-gray-700">담당자 이름:</label>
          <input
            type="text"
            id="memberName"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '프로필 저장'}
        </button>
      </form>
    </div>
  );
};

export default UserProfile;
