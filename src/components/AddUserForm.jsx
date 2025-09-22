import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from './SupabaseProvider';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AddUserForm = ({ onSuccess }) => {
  const supabase = useSupabase();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [memberName, setMemberName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!supabase) {
      toast.error('Supabase client is not available.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error: functionError } = await supabase.functions.invoke('create-clerk-user', {
        body: {
          username,
          password,
          phoneNumber,
          memberName,
        },
      });

      if (functionError) {
        throw functionError;
      }

      toast.success(`사용자 '${username}'가 성공적으로 생성되었습니다!`);
      // Clear form
      setUsername('');
      setPassword('');
      setPhoneNumber('');
      setMemberName('');
      // Trigger parent action (e.g., navigation)
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Error creating user:', err);
      // Specific password error from Clerk
      if (err.message && err.message.includes('form_password_pwned')) {
        setError('보안에 취약한 비밀번호입니다. 온라인 데이터 유출에서 발견된 적이 있으니 다른 비밀번호를 사용해주세요.');
        toast.error('비밀번호가 안전하지 않습니다.', {
          description: '다른 비밀번호를 사용해주세요.',
        });
      } else {
        const errorMessage = err.message || '사용자 생성에 실패했습니다.';
        setError(errorMessage);
        toast.error('사용자 생성 실패', {
          description: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 사용자 생성</CardTitle>
        <CardDescription>새로운 센터(사용자)를 시스템에 등록합니다. 센터명과 비밀번호는 필수 항목입니다.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">센터명 (필수)</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="예: 다짐 피트니스 강남점"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호 (필수)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              비밀번호는 8자 이상이어야 하며, 너무 흔하거나 유출된 비밀번호는 사용할 수 없습니다.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="memberName">센터 담당자</Label>
            <Input
              id="memberName"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="예: 홍길동"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">담당자 연락처</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="예: 010-1234-5678"
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              '사용자 생성'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AddUserForm;