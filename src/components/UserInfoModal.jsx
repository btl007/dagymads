import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

const UserInfoModal = ({ userProfile, username, onSave, onClose }) => {
  const supabase = useSupabase();
  
  // State for editable fields
  const [centerName, setCenterName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  useEffect(() => {
    if (userProfile) {
      setCenterName(userProfile.center_name || '');
      setMemberName(userProfile.member_name || '');
      setPhoneNumber(userProfile.phone_number || '');
    }
  }, [userProfile]);

  const handleSaveClick = async () => {
    if (!supabase || !userProfile) return;

    const updates = {
      center_name: centerName,
      member_name: memberName,
      phone_number: phoneNumber,
    };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userProfile.user_id);

      if (error) throw error;

      toast.success('사용자 정보가 성공적으로 업데이트되었습니다.');
      if (onSave) {
        onSave(); // Trigger parent to refresh data
      }
      onClose(); // Close the modal
    } catch (error) {
      toast.error('사용자 정보 업데이트에 실패했습니다.', {
        description: error.message,
      });
    }
  };

  if (!userProfile) {
    return null; // Or a loading state
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{centerName || username}</DialogTitle>
        <DialogDescription>
          @{username} 사용자의 정보를 수정합니다.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="centerName" className="text-right">
            센터 이름
          </Label>
          <Input
            id="centerName"
            value={centerName}
            onChange={(e) => setCenterName(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="memberName" className="text-right">
            담당자명
          </Label>
          <Input
            id="memberName"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="phoneNumber" className="text-right">
            연락처
          </Label>
          <Input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="col-span-3"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button onClick={handleSaveClick}>저장</Button>
      </DialogFooter>
    </>
  );
};

export default UserInfoModal;
