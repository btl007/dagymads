import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '../components/SupabaseProvider';
import { useUser } from '@clerk/clerk-react';
import Editor from '../components/Editor';
import MyScript from '../components/MyScript';
import { BookUser, X, PanelLeftClose, PanelLeftOpen, CalendarDays } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import * as Lexical from 'lexical';
import { $createScriptContainerNode } from '../nodes/ScriptContainerNode';
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { Button } from "@/components/ui/button";
import UserScheduleModal from "@/components/UserScheduleModal";
import { STATUS_MAP } from '../data/projectStatuses.js';

import sampleScripts from '../data/sampleScript';

// --- SaveButton Component (Refactored) ---
const SaveButton = ({ editor, title, scriptId, onSaveSuccess, currentStatus }) => {
  const supabase = useSupabase();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!editor || !supabase || !user) {
      alert('에디터 또는 사용자 정보가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (projectError || !projectData) {
      console.error('Error finding project:', projectError);
      alert('연결할 프로젝트를 찾을 수 없습니다. 관리자에게 문의하세요.');
      return;
    }
    const projectId = projectData.id;

    const editorState = editor.getEditorState();
    const content = editorState.toJSON();
    let error;
    let newScriptId = scriptId;

    const scriptPayload = {
      title,
      content,
      project_id: projectId,
      updated_at: new Date(),
    };

    if (scriptId) {
      const { error: updateError } = await supabase.from('scripts').update(scriptPayload).eq('id', scriptId);
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase.from('scripts').insert({ ...scriptPayload, user_id: user.id }).select('id').single();
      error = insertError;
      if (data) newScriptId = data.id;
    }

    if (error) {
      console.error('Error saving script:', error);
      alert(`저장에 실패했습니다: ${error.message}`);
    } else {
      alert('스크립트가 성공적으로 저장되었습니다!');
      onSaveSuccess(JSON.stringify(content));
      if (!scriptId && newScriptId) {
        navigate(`/editor/${newScriptId}`, { replace: true });
      }
    }
  };

  const handleSubmit = async () => {
    if (!supabase || !user || !scriptId) {
      alert('스크립트가 저장되지 않았거나 초기화 중입니다.');
      return;
    }

    const isConfirmed = window.confirm("접수되면 해당 대본의 내용으로 촬영팀이 촬영을 진행하며, 유선 연락이 갈 수 있습니다. 동의하십니까?");
    if (!isConfirmed) return;

    try {
      const { data: scriptData, error: fetchError } = await supabase.from('scripts').select('project_id').eq('id', scriptId).single();
      if (fetchError || !scriptData || !scriptData.project_id) throw new Error('스크립트에 연결된 프로젝트를 찾을 수 없습니다.');
      const { project_id } = scriptData;

      const [scriptUpdateResult, projectUpdateResult] = await Promise.all([
        supabase.from('scripts').update({ status: 'submitted', updated_at: new Date(), submitted_at: new Date() }).eq('id', scriptId),
        supabase.from('projects').update({ status: 'script_submitted' }).eq('id', project_id)
      ]);

      if (scriptUpdateResult.error) throw scriptUpdateResult.error;
      if (projectUpdateResult.error) throw projectUpdateResult.error;

      alert('대본이 성공적으로 접수되었고, 프로젝트 상태가 업데이트되었습니다!');
      window.location.reload();
    } catch (error) {
      console.error('Error submitting script:', error);
      alert(`대본 접수에 실패했습니다: ${error.message}`);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <InteractiveHoverButton onClick={handleSave}>저장</InteractiveHoverButton>
      {scriptId && (
        <button
          onClick={handleSubmit}
          className={`font-bold py-2 px-4 rounded ${currentStatus === 'submitted' ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-700 text-white'}`}
          disabled={currentStatus === 'submitted'}
        >
          {currentStatus === 'submitted' ? '접수됨' : '접수'}
        </button>
      )}
    </div>
  );
};

// --- ScriptEditor Page (Refactored) ---
export default function ScriptEditor() {
  const { scriptId } = useParams();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const { user } = useUser();
  const [editorInstance, setEditorInstance] = useState(null);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSampleScriptVisible, setIsSampleScriptVisible] = useState(true);
  const [isMyScriptVisible, setIsMyScriptVisible] = useState(false);
  const [currentScriptStatus, setCurrentScriptStatus] = useState('draft');
  const [isDirty, setIsDirty] = useState(false);
  const initialContentRef = useRef(null);
  const myScriptPanelRef = useRef(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [confirmedSlot, setConfirmedSlot] = useState(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (myScriptPanelRef.current && !myScriptPanelRef.current.contains(event.target)) {
        setIsMyScriptVisible(false);
      }
    }
    if (isMyScriptVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMyScriptVisible]);

  useEffect(() => {
    if (!editorInstance || !supabase || !user) return;

    const initializePage = async () => {
      setIsLoading(true);
      try {
        // Fetch project and script data in parallel
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (projectError) {
          console.warn('Could not find a project for this user.', projectError);
        } else {
          setCurrentProject(projectData);
          // If project exists, fetch the confirmed slot time
          if (projectData) {
            const { data: slotData, error: slotError } = await supabase
              .from('time_slots')
              .select('slot_time')
              .eq('project_id', projectData.id)
              .eq('booking_status', 'confirmed')
              .single();
            if (slotData) {
              setConfirmedSlot(slotData);
            }
          }
        }

        const { data: scriptData, error: scriptError } = scriptId
          ? await supabase.from('scripts').select('title, content, status').eq('id', scriptId).single()
          : { data: null, error: null };

        if (scriptError) throw scriptError;

        let initialContentJson;
        let scriptStatus = 'draft';
        if (scriptId && scriptData) {
          setTitle(scriptData.title);
          initialContentJson = scriptData.content;
          scriptStatus = scriptData.status || 'draft';
        } else {
          setTitle('제목없는 대본');
          initialContentJson = { root: { children: [{ type: 'paragraph', children: [] }], direction: null, format: '', indent: 0, type: 'root', version: 1 } };
        }
        setCurrentScriptStatus(scriptStatus);
        const editorState = editorInstance.parseEditorState(initialContentJson);
        editorInstance.setEditorState(editorState);
        initialContentRef.current = JSON.stringify(initialContentJson);
        setIsDirty(false);
      } catch (e) {
        console.error("Failed to initialize editor:", e);
        setTitle("스크립트 불러오기 실패");
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [scriptId, editorInstance, supabase, user]);

  const handleOnChange = (editorState) => {
    if (!initialContentRef.current) return;
    const currentContent = JSON.stringify(editorState.toJSON());
    setIsDirty(currentContent !== initialContentRef.current);
  };

  const handleSaveSuccess = (savedContent) => {
    initialContentRef.current = savedContent;
    setIsDirty(false);
  };

  const handleNavigate = useCallback((targetId) => {
    if (isDirty) {
      if (window.confirm('저장되지 않은 변경사항이 있습니다. 정말로 이동하시겠습니까?')) {
        navigate(`/editor/${targetId}`);
      }
    } else {
      navigate(`/editor/${targetId}`);
    }
  }, [isDirty, navigate]);

  const insertNewScriptBlock = (content) => {
    if (!editorInstance) return;
    editorInstance.update(() => {
      const containerNode = $createScriptContainerNode();
      const paragraphNode = Lexical.$createParagraphNode();
      const textNode = Lexical.$createTextNode(content);
      paragraphNode.append(textNode);
      containerNode.append(paragraphNode);
      const selection = Lexical.$getSelection();
      if (Lexical.$isRangeSelection(selection)) {
        selection.insertNodes([containerNode]);
      } else {
        Lexical.$getRoot().append(containerNode);
      }
      containerNode.selectEnd();
    });
  };

  const formatShootDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:00`;
  };

  return (
    <section className="w-full flex bg-[rgb(25,25,25)] min-h-screen">
      <AnimatePresence>
        {isSampleScriptVisible && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-80 bg-slate-900 p-4 space-y-4 overflow-y-auto border-r border-slate-700"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">예시 대본</h2>
            </div>
            {sampleScripts.map((script) => (
              <button
                key={script.id}
                onClick={() => insertNewScriptBlock(script.content)}
                className="w-full text-left px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
              >
                <h4 className="text-lg font-bold text-white">{script.title}</h4>
                <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-lg">{script.props}</span>
                <p className="text-base text-gray-300">{script.content}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative">
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-[rgb(25,25,25)] z-30">
            <p className="text-white">로딩 중...</p>
          </div>
        )}

        {/* --- Unified Toolbar --- */}
        <div className="w-full flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSampleScriptVisible(!isSampleScriptVisible)}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full transition-all duration-300"
              title={isSampleScriptVisible ? "예시 대본 닫기" : "예시 대본 보기"}
            >
              {isSampleScriptVisible ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <button
              onClick={() => setIsMyScriptVisible(true)}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full transition-all duration-300"
              title="내 대본 목록"
            >
              <BookUser size={20} />
            </button>
            {currentProject && (
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <span>상태:</span>
                  <span className="font-semibold text-white">{STATUS_MAP.get(currentProject.status) || currentProject.status}</span>
                </div>
                {confirmedSlot && (
                  <>
                    <span className="text-gray-500">|</span>
                    <div className="flex items-center space-x-2">
                      <span>촬영일:</span>
                      <span className="font-semibold text-white">{formatShootDate(confirmedSlot.slot_time)}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsScheduleModalOpen(true)}
              disabled={!currentProject || currentScriptStatus === 'submitted'}
              title={!currentProject ? "예약을 진행할 프로젝트가 없습니다." : "이 프로젝트의 촬영일 예약하기"}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              촬영일 예약
            </Button>
            {!isLoading && <SaveButton editor={editorInstance} title={title} scriptId={scriptId} onSaveSuccess={handleSaveSuccess} currentStatus={currentScriptStatus} />}
          </div>
        </div>

        {/* --- Editor Content --- */}
        <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
            placeholder="대본 제목을 입력하세요"
            className="text-3xl font-bold bg-transparent border-b-2 border-gray-700 focus:border-blue-500 outline-none w-full mb-6 text-white"
          />
          <div className="relative flex-1">
            <Editor onReady={setEditorInstance} onChange={handleOnChange} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMyScriptVisible && (
          <motion.div
            ref={myScriptPanelRef}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-96 bg-slate-900 shadow-lg z-40 p-4 overflow-y-auto border-l border-slate-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">내 대본</h2>
              <button
                onClick={() => setIsMyScriptVisible(false)}
                className="p-1 text-gray-500 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <MyScript handleNavigate={handleNavigate} />
          </motion.div>
        )}
      </AnimatePresence>

      {currentProject && (
        <UserScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          project={currentProject}
        />
      )}
    </section>
  );
}