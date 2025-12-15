import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

const UserInfoModal = ({ userProfile, username, onSave, onClose }) => {
  const supabase = useSupabase();
  const [isResetting, setIsResetting] = useState(false);
  
  // State for editable fields
  const [centerName, setCenterName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [salesManager, setSalesManager] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  
  useEffect(() => {
    if (userProfile) {
      setCenterName(userProfile.center_name || '');
      setMemberName(userProfile.member_name || '');
      setSalesManager(userProfile.sales_manager || '');
      setPhoneNumber(userProfile.phone_number || '');
      setAddress(userProfile.address || '');
    }
  }, [userProfile]);

  const handleSaveClick = async () => {
    if (!supabase || !userProfile) return;

    const updates = {
      center_name: centerName,
      member_name: memberName,
      sales_manager: salesManager,
      phone_number: phoneNumber,
      address: address,
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

  const handleResetPassword = async () => {
    if (!confirm("비밀번호를 초기화하시겠습니까?\n\n초기값: Dagym1234!")) {
      return;
    }

    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-clerk-user-password', {
        body: { 
          userId: userProfile.user_id,
          newPassword: 'Dagym1234!'
        }
      });

      if (error) throw error;
      
      toast.success('비밀번호가 초기화되었습니다.', {
        description: '초기 비밀번호: Dagym1234!'
      });
    } catch (err) {
      console.error('Password reset error:', err);
      toast.error('비밀번호 초기화 실패', {
        description: err.message
      });
    } finally {
      setIsResetting(false);
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
          <Label htmlFor="salesManager" className="text-right">
            영업 담당자
          </Label>
          <Input
            id="salesManager"
            value={salesManager}
            onChange={(e) => setSalesManager(e.target.value)}
            placeholder="미정"
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
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="address" className="text-right">
            주소
          </Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="col-span-3"
          />
        </div>
      </div>

      <DialogFooter className="flex justify-between items-center sm:justify-between">
        <Button 
          variant="destructive" 
          onClick={handleResetPassword} 
          disabled={isResetting}
          type="button"
        >
          <Lock className="w-4 h-4 mr-2" />
          {isResetting ? '초기화 중...' : '비밀번호 초기화'}
        </Button>
        <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleSaveClick}>저장</Button>
        </div>
      </DialogFooter>
    </>
  );
};

export default UserInfoModal;
