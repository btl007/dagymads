// src/components/AddUserForm.jsx
import React, { useState } from 'react';
import { useSupabase } from './SupabaseProvider'; // Import useSupabase

const AddUserForm = () => {
  const supabase = useSupabase(); // Get supabase instance
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [memberName, setMemberName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    if (!supabase) {
      setMessage('Supabase client is not available.');
      setIsError(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-clerk-user', {
        body: {
          username,
          password,
          email,
          firstName,
          lastName,
          phoneNumber,
          memberName,
        },
      });

      if (error) {
        setIsError(true);
        // Check for the specific Clerk password error
        if (error.message && error.message.includes('form_password_pwned')) {
          setMessage('보안에 취약한 비밀번호입니다. 온라인 데이터 유출에서 발견된 적이 있으니 다른 비밀번호를 사용해주세요.');
        } else {
          setMessage(error.message || '사용자 생성에 실패했습니다.');
        }
        console.error('Error creating user:', error.message);
      } else {
        setMessage(`사용자 ${username || email}가 성공적으로 생성되었습니다!`);
        // Clear form
        setUsername('');
        setPassword('');
        setEmail('');
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setMemberName('');
      }
    } catch (err) {
      setIsError(true);
      setMessage('네트워크 오류 또는 서버 응답 없음.');
      console.error('Network error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-700 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4 text-white">새 사용자 추가</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-300">사용자 이름 (Clerk):</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full rounded-md bg-slate-800 border-slate-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300">비밀번호 (Clerk):</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md bg-slate-800 border-slate-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
          <p className="mt-1 text-xs text-slate-400">비밀번호는 8자 이상이어야 하며, 너무 흔하거나 유출된 비밀번호는 사용할 수 없습니다.</p>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300">이메일 (Clerk, 선택 사항):</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md bg-slate-800 border-slate-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-slate-300">이름 (Clerk, 선택 사항):</label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full rounded-md bg-slate-800 border-slate-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-slate-300">성 (Clerk, 선택 사항):</label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full rounded-md bg-slate-800 border-slate-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-300">전화번호 (Supabase):</label>
          <input
            type="text"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="mt-1 block w-full rounded-md bg-slate-800 border-slate-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="memberName" className="block text-sm font-medium text-slate-300">담당자 이름 (Supabase):</label>
          <input
            type="text"
            id="memberName"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            className="mt-1 block w-full rounded-md bg-slate-800 border-slate-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? '생성 중...' : '사용자 생성'}
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded-md text-center ${isError ? 'bg-red-900 bg-opacity-50 text-red-300' : 'bg-green-900 bg-opacity-50 text-green-300'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default AddUserForm;
