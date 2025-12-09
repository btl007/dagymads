import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useUserCache } from '@/contexts/UserCacheContext';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, CheckCircle, XCircle, FileText, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

// Helper to render Lexical content as simple text with line breaks
const LexicalViewer = ({ content }) => {
  if (!content) return <div className="text-muted-foreground">내용이 없습니다.</div>;

  let textContent = [];
  try {
    const parsedJson = typeof content === 'string' ? JSON.parse(content) : content;
    if (parsedJson?.root?.children) {
      const traverse = (nodes) => {
        nodes.forEach(node => {
          if (node.type === 'text') {
            textContent.push(node.text);
          } else if (node.type === 'linebreak') {
            textContent.push('\n');
          } else if (node.children) {
            traverse(node.children);
            if (node.type === 'paragraph' || node.type === 'script-container') {
                textContent.push('\n\n');
            }
          }
        });
      };
      traverse(parsedJson.root.children);
    }
  } catch (e) {
    return <div className="text-red-400">대본 형식이 올바르지 않습니다.</div>;
  }

  return (
    <div className="whitespace-pre-wrap leading-relaxed text-slate-300 font-sans">
      {textContent.join('')}
    </div>
  );
};

const AdminScript = () => {
  const supabase = useSupabase();
  const { userCache, getUserNames } = useUserCache();
  const [scripts, setScripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScriptId, setSelectedScriptId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select(`
          id, title, content, updated_at, status, submitted_at, user_id,
          projects (name)
        `)
        .neq('status', 'draft')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      const userIds = [...new Set(data.map(s => s.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        await getUserNames(userIds);
      }

      setScripts(data || []);
    } catch (err) {
      console.error('Error fetching scripts:', err);
      toast.error('대본 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, getUserNames]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (scriptId, newStatus) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('scripts')
        .update({ status: newStatus })
        .eq('id', scriptId);

      if (error) throw error;
      toast.success(`상태가 '${newStatus}'(으)로 변경되었습니다.`);
      fetchData(); // Refresh list
    } catch (err) {
      toast.error('상태 변경 실패: ' + err.message);
    }
  };

  const filteredScripts = useMemo(() => {
    if (activeTab === 'all') return scripts;
    if (activeTab === 'pending') return scripts.filter(s => s.status === 'submitted' || s.status === 'under_review');
    if (activeTab === 'approved') return scripts.filter(s => s.status === 'approved');
    return scripts;
  }, [scripts, activeTab]);

  const groupedScripts = useMemo(() => {
    const groups = filteredScripts.reduce((acc, script) => {
        const userId = script.user_id;
        if (!acc[userId]) acc[userId] = [];
        acc[userId].push(script);
        return acc;
    }, {});

    // Sort users by latest script submission
    return Object.entries(groups).sort(([, aScripts], [, bScripts]) => {
        const dateA = new Date(aScripts[0].submitted_at || aScripts[0].updated_at);
        const dateB = new Date(bScripts[0].submitted_at || bScripts[0].updated_at);
        return dateB - dateA;
    });
  }, [filteredScripts]);

  const selectedScript = useMemo(() => 
    scripts.find(s => s.id === selectedScriptId), 
  [scripts, selectedScriptId]);

  return (
    <div className="flex h-[calc(100vh-6rem)] w-full gap-4 p-4 md:p-8">
      {/* Left Panel: Script List */}
      <div className="w-full md:w-1/3 flex flex-col gap-4 bg-card border rounded-lg p-2 overflow-hidden">
        <div className="p-2">
            <h2 className="text-xl font-bold mb-1">대본 관리</h2>
            <p className="text-sm text-muted-foreground">접수된 대본을 검토하고 승인합니다.</p>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="pending">검토 대기</TabsTrigger>
            <TabsTrigger value="approved">승인됨</TabsTrigger>
          </TabsList>
        </Tabs>

        <ScrollArea className="flex-1 px-1">
            {isLoading ? (
               <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
            ) : groupedScripts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">대본이 없습니다.</div>
            ) : (
                <Accordion type="multiple" className="w-full">
                    {groupedScripts.map(([userId, userScripts]) => (
                        <AccordionItem key={userId} value={userId}>
                            <AccordionTrigger className="hover:no-underline py-3 px-2">
                                <div className="flex items-center justify-between w-full pr-2">
                                    <span className="font-semibold text-sm">
                                        {userCache[userId]?.username || '센터 미정'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {userScripts.some(s => s.status === 'submitted') && (
                                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">NEW</Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">{userScripts.length}</Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-4">
                                <div className="flex flex-col gap-2">
                                    {userScripts.map((script) => (
                                        <button
                                            key={script.id}
                                            onClick={() => setSelectedScriptId(script.id)}
                                            className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent/50 ${
                                            selectedScriptId === script.id ? "bg-accent border-primary/50" : "bg-card/50"
                                            }`}
                                        >
                                            <div className="flex w-full flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-xs text-muted-foreground truncate max-w-[150px]">
                                                        {script.projects?.name || '프로젝트 미정'}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(script.updated_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="line-clamp-2 text-sm font-medium w-full">
                                                    {script.title || '제목 없음'}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant={script.status === 'approved' ? 'default' : 'outline'} className="text-[10px] h-5 px-1.5">
                                                        {script.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </ScrollArea>
      </div>

      {/* Right Panel: Script Detail */}
      <div className="hidden md:flex flex-1 flex-col bg-card border rounded-lg overflow-hidden">
        {selectedScript ? (
            <>
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold">{selectedScript.title}</h2>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {userCache[selectedScript.user_id]?.username || 'N/A'}</span>
                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {selectedScript.projects?.name}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(selectedScript.updated_at).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => handleStatusUpdate(selectedScript.id, 'under_review')}
                            disabled={selectedScript.status === 'under_review'}
                        >
                            검토 중
                        </Button>
                        <Button 
                            className="bg-green-600 hover:bg-green-500" 
                            onClick={() => handleStatusUpdate(selectedScript.id, 'approved')}
                            disabled={selectedScript.status === 'approved'}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> 승인
                        </Button>
                    </div>
                </div>
                <ScrollArea className="flex-1 p-6 bg-slate-950/30">
                    <div className="max-w-3xl mx-auto bg-slate-900 border rounded-lg p-8 min-h-[500px] shadow-sm">
                        <LexicalViewer content={selectedScript.content} />
                    </div>
                </ScrollArea>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>좌측 목록에서 대본을 선택하여 내용을 확인하세요.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminScript;