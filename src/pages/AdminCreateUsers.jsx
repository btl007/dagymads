import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddUserForm from '../components/AddUserForm';

const AdminCreateUser = () => {
  const navigate = useNavigate();

  const handleUserAdded = () => {
    alert('새로운 사용자가 성공적으로 추가되었습니다.');
    navigate('/admin/users'); // 사용자 추가 후, 사용자 목록 페이지로 이동
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-white">새 사용자 생성</h1>
        <p className="text-lg text-slate-400 mb-8">새로운 센터(사용자)를 시스템에 등록합니다.</p>
        <AddUserForm onUserAdded={handleUserAdded} />
      </div>
    </div>
  );
};

export default AdminCreateUser;
