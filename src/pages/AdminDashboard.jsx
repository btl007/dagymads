// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../components/SupabaseProvider'; // Import useSupabase

// Helper function to extract plain text from Lexical JSON state for a preview
const extractTextFromLexical = (json) => {
  console.log("extractTextFromLexical received json:", JSON.stringify(json, null, 2)); // Debugging line: stringify for full object
  let text = '';
  try {
    const parsedJson = typeof json === 'string' ? JSON.parse(json) : json;

    if (parsedJson && parsedJson.root && parsedJson.root.children) {
      for (const rootChild of parsedJson.root.children) { // Iterate through root's children
        // Check if it's a script-container or a standard paragraph
        if (rootChild.type === 'script-container' && rootChild.children) {
          for (const containerChild of rootChild.children) { // Iterate through script-container's children
            if (containerChild.children) {
              for (const innerChild of containerChild.children) {
                if (innerChild.type === 'text') {
                  text += innerChild.text + ' ';
                }
              }
            }
          }
        } else if (rootChild.children) { // Handle standard paragraph or other nodes directly under root
          for (const innerChild of rootChild.children) {
            if (innerChild.type === 'text') {
              text += innerChild.text + ' ';
            }
          }
        }
        if (text.length > 100) break;
      }
    }
  } catch (e) {
    console.error("Failed to parse Lexical content for preview", e);
    return "(미리보기를 생성할 수 없습니다)";
  }
  return text.trim();
};

const AdminDashboard = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const supabase = useSupabase(); // Initialize supabase

  const [groupedScripts, setGroupedScripts] = useState({}); // Changed to object for grouping
  const [isLoadingScripts, setIsLoadingScripts] = useState(true);
  const [errorScripts, setErrorScripts] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null); // New state for selected user in column 1
  const [selectedScriptId, setSelectedScriptId] = useState(null); // New state for selected script in column 2
  const [userNamesMap, setUserNamesMap] = useState({}); // New state for storing user names
  const [selectedUserProfile, setSelectedUserProfile] = useState(null); // New state for selected user's profile

  if (!isLoaded) {
    // Clerk user data is not yet loaded
    return <div>Loading user data...</div>;
  }

  // Check if the user is an admin based on publicMetadata
  const isAdmin = user && user.publicMetadata && user.publicMetadata.is_admin === "true";

  if (!isAdmin) {
    // If not an admin, redirect or show an access denied message
    // For now, let's just show a message. You might want to navigate('/some-other-page')
    // or navigate('/') here.
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700">You do not have permission to view this page.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!supabase) return;

    const fetchSubmittedScripts = async () => {
      setIsLoadingScripts(true);
      setErrorScripts(null);
      try {
        const { data, error } = await supabase
          .from('scripts')
          .select('id, title, content, updated_at, status, user_id, submitted_at') // Select all relevant fields
          .neq('status', 'draft') // Filter by status not equal to 'draft'
          .order('updated_at', { ascending: false });

        if (error) {
          throw error;
        }
        // Group scripts by user_id
        const scriptsByUser = data.reduce((acc, script) => {
          if (!acc[script.user_id]) {
            acc[script.user_id] = [];
          }
          acc[script.user_id].push(script);
          return acc;
        }, {});
        setGroupedScripts(scriptsByUser);
        // Automatically select the first user if available
        if (Object.keys(scriptsByUser).length > 0) {
          const uniqueUserIds = Object.keys(scriptsByUser);
          setSelectedUserId(uniqueUserIds[0]);

          // Fetch user details from Clerk via Edge Function
          try {
            const response = await fetch('https://jymezpvjdcsdxfreozry.supabase.co/functions/v1/get-clerk-user-details', { // Adjust URL if needed
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userIds: uniqueUserIds }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setUserNamesMap(data);
          } catch (clerkErr) {
            console.error('Error fetching Clerk user details:', clerkErr);
            // Handle error, maybe set a default name or show an error message
          }
        }
      } catch (err) {
        console.error('Error fetching submitted scripts:', err);
        setErrorScripts(err);
      } finally {
        setIsLoadingScripts(false);
      }
    };

    fetchSubmittedScripts();
  }, [supabase]); // Dependency array includes supabase

  // Effect to fetch selected user's profile details
  useEffect(() => {
    if (!supabase || !selectedUserId) {
      setSelectedUserProfile(null); // Clear profile if no user selected
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*') // Select all profile fields
          .eq('user_id', selectedUserId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
          throw error;
        }
        setSelectedUserProfile(data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setSelectedUserProfile(null); // Clear profile on error
      }
    };

    fetchUserProfile();
  }, [supabase, selectedUserId]); // Re-run when supabase or selectedUserId changes

  const handleStatusChange = async (scriptId, newStatus) => {
    if (!supabase) return;
    if (!window.confirm(`대본의 상태를 '${newStatus}'(으)로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('scripts')
        .update({ status: newStatus, updated_at: new Date() })
        .eq('id', scriptId);

      if (error) {
        throw error;
      }
      alert(`대본 상태가 '${newStatus}'(으)로 변경되었습니다.`);
      // Re-fetch scripts to update the UI
      const { data, error: fetchError } = await supabase
        .from('scripts')
        .select('id, title, content, updated_at, status, user_id, submitted_at')
        .neq('status', 'draft') // Filter by status not equal to 'draft'
        .order('updated_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }
      // Re-group scripts by user_id after re-fetch
      const scriptsByUser = data.reduce((acc, script) => {
        if (!acc[script.user_id]) {
          acc[script.user_id] = [];
        }
        acc[script.user_id].push(script);
        return acc;
      }, {});
      setGroupedScripts(scriptsByUser);
    } catch (err) {
      console.error('Error updating script status:', err);
      alert(`상태 변경에 실패했습니다: ${err.message}`);
    }
  };

  // If the user is an admin, render the dashboard content
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="text-lg">Welcome, Admin {user.firstName || user.username}!</p>

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md flex h-[70vh]"> {/* Added flex and height for columns */}
        {isLoadingScripts ? (
          <p>로딩 중...</p>
        ) : errorScripts ? (
          <p className="text-red-500">오류가 발생했습니다: {errorScripts.message}</p>
        ) : Object.keys(groupedScripts).length === 0 ? (
          <p>접수된 대본이 없습니다.</p>
        ) : (
          <>
            {/* Column 1: User List */}
            <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
              <h2 className="text-xl text-black font-semibold mb-4">사용자</h2>
              <ul className="space-y-2">
                {Object.keys(groupedScripts).map((userId) => (
                  <li
                    key={userId}
                    onClick={() => {
                      setSelectedUserId(userId);
                      setSelectedScriptId(null); // Reset selected script when user changes
                    }}
                    className={`p-2 cursor-pointer rounded-md ${selectedUserId === userId ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                  >
                    {userNamesMap[userId]?.firstName || userNamesMap[userId]?.username || userId}
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Scripts for Selected User */}
            <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
              <h2 className="text-xl text-black font-semibold mb-4">대본 제목</h2>
              {selectedUserId && (
                <div className="mb-4 p-3 bg-gray-100 rounded-md">
                  <h3 className="font-bold text-lg text-black">
                    {userNamesMap[selectedUserId]?.firstName || userNamesMap[selectedUserId]?.username || selectedUserId}
                  </h3>
                  {selectedUserProfile && (
                    <>
                      <p className="text-sm text-gray-700">전화번호: {selectedUserProfile.phone_number || '없음'}</p>
                      <p className="text-sm text-gray-700">담당자 이름: {selectedUserProfile.member_name || '없음'}</p>
                    </>
                  )}
                </div>
              )}
              {selectedUserId && groupedScripts[selectedUserId] && (
                <ul className="space-y-2">
                  {groupedScripts[selectedUserId].map((script) => (
                    <li
                      key={script.id}
                      onClick={() => setSelectedScriptId(script.id)}
                      className={`p-2 cursor-pointer rounded-md ${selectedScriptId === script.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-black text-base">{script.title}</h3>
                        {script.submitted_at && (
                          <div
                            className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-lg"
                            title={`대본 접수일: ${new Date(script.submitted_at).toLocaleString()}`}
                          >
                            D+ {Math.floor((new Date() - new Date(script.submitted_at)) / (1000 * 60 * 60 * 24))} 일
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        상태: <span className="font-semibold">{script.status}</span> | 수정: {new Date(script.updated_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Column 3: Content of Selected Script */}
            <div className="w-1/3 p-4 overflow-y-auto">
              <h2 className="text-xl text-black font-semibold mb-4">대본 내용</h2>
              {selectedScriptId && groupedScripts[selectedUserId] && (
                (() => {
                  const selectedScript = groupedScripts[selectedUserId].find(s => s.id === selectedScriptId);
                  if (!selectedScript) return <p>대본을 선택해주세요.</p>;

                  return (
                    <div>
                      <h3 className="font-bold text-black text-lg mb-2">{selectedScript.title}</h3>
                      <p className="text-gray-700 mb-4">
                        {extractTextFromLexical(selectedScript.content) || '(내용 없음)'}
                      </p>
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleStatusChange(selectedScript.id, 'under_review')}
                          className={`px-3 py-1 text-sm rounded ${selectedScript.status === 'under_review' ? 'bg-yellow-700 text-white cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
                          disabled={selectedScript.status === 'under_review'}
                        >
                          검토 중
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedScript.id, 'approved')}
                          className={`px-3 py-1 text-sm rounded ${selectedScript.status === 'approved' ? 'bg-green-700 text-white cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                          disabled={selectedScript.status === 'approved'}
                        >
                          승인
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
              {!selectedScriptId && <p>대본을 선택해주세요.</p>}
            </div>
          </>
        )}
      </div>

      <div className="mt-8 p-6 bg-white text-black rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Admin Tools</h2>
        <ul className="list-disc list-inside">
          <li>Manage Users</li>
          <li>View System Logs</li>
          <li>Configure Settings</li>
          {/* Add more admin-specific tools here */}
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;
