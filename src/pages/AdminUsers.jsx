import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../components/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import UserInfoModal from '../components/UserInfoModal';

const AdminUsers = () => {
  const supabase = useSupabase();
  const [userProfiles, setUserProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUserProfiles = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, center_name, member_name, phone_number, address, created_at')
        .order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      const { data: clerkUsersData, error: clerkUsersError } = await supabase.functions.invoke('get-all-clerk-users', { method: 'GET' });
      if (clerkUsersError) throw clerkUsersError;

      const clerkUsernameMap = new Map(clerkUsersData.map(u => [u.id, u.username]));
      const combinedProfiles = profilesData.map(profile => ({
        ...profile,
        username: clerkUsernameMap.get(profile.user_id) || 'N/A',
      }));

      setUserProfiles(combinedProfiles || []);
    } catch (err) {
      console.error('Error fetching user profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUserProfiles();
  }, [fetchUserProfiles]);

  const handleEditClick = (profile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProfile(null);
  };

  const handleSaveSuccess = () => {
    fetchUserProfiles(); // Refresh the list after saving
  };

  const filteredProfiles = useMemo(() => {
    return userProfiles.filter(profile => 
      profile.center_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.member_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [userProfiles, searchTerm]);

  return (
    <div className="p-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-white">사용자 목록</h1>
                <p className="text-lg text-slate-400 mt-1">현재 등록된 모든 사용자 계정을 관리합니다.</p>
            </div>
            <Link to="/admin/createusers">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    새 사용자 추가
                </Button>
            </Link>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="센터명, ID, 담당자명 검색..." 
            className="pl-8 bg-slate-900 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div className="bg-card border rounded-lg overflow-hidden">
          {isLoading ? (
             <div className="p-4 space-y-4">
               {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">번호</TableHead>
                  <TableHead>센터명</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>주소</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length > 0 ? (
                  filteredProfiles.map((profile, index) => (
                    <TableRow key={profile.user_id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-semibold">{profile.center_name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">@{profile.username}</TableCell>
                      <TableCell>{profile.member_name || '-'}</TableCell>
                      <TableCell>{profile.phone_number || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={profile.address}>{profile.address || '-'}</TableCell>
                      <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(profile)}>
                          수정
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {selectedProfile && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <UserInfoModal
              userProfile={selectedProfile}
              username={selectedProfile.username}
              onSave={handleSaveSuccess}
              onClose={handleModalClose}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminUsers;
