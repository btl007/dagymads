import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddUserForm from '../components/AddUserForm';

const AdminCreateUser = () => {
  const navigate = useNavigate();

  // This function will be called on successful user creation
  const handleSuccess = () => {
    // Navigate to the users list page
    navigate('/admin/users');
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <AddUserForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default AdminCreateUser;