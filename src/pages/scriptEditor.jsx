import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useSupabase } from '../components/SupabaseProvider';
import { useUser } from '@clerk/clerk-react';
import Editor from '../components/Editor';
import MyScript from '../components/MyScript';
import { BookUser } from 'lucide-react';
import * as Lexical from 'lexical'; // Changed import
import { $createScriptContainerNode } from '../nodes/ScriptContainerNode'; // Keep this separate

import sampleScripts from '../data/sampleScript';

// --- SaveButton Component ---
const SaveButton = ({ title, scriptId, onSaveSuccess, currentStatus }) => {
  const [editor] = useLexicalComposerContext();
  const supabase = useSupabase();
  const { user } = useUser();
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!supabase || !user || !editor) {
      alert('초기화 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    const editorState = editor.getEditorState();
    const content = editorState.toJSON();
    let error;
    let newScriptId = scriptId;

    if (scriptId) {
      const { error: updateError } = await supabase
        .from('scripts')
        .update({ title, content, updated_at: new Date() })
        .eq('id', scriptId);
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from('scripts')
        .insert({ user_id: user.id, title, content })
        .select('id')
        .single();
      error = insertError;
      if (data) {
        newScriptId = data.id;
      }
    }

    if (error) {
      console.error('Error saving script:', error);
      alert(`저장에 실패했습니다: ${error.message}`);
    } else {
      alert('스크립트가 성공적으로 저장되었습니다!');
      onSaveSuccess(JSON.stringify(content)); // Notify parent of successful save
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

    const { error } = await supabase
      .from('scripts')
      .update({ status: 'submitted', updated_at: new Date(), submitted_at: new Date() }) // Add submitted_at
      .eq('id', scriptId);

    if (error) {
      console.error('Error submitting script:', error);
      alert(`대본 접수에 실패했습니다: ${error.message}`);
    } else {
      alert('대본이 성공적으로 접수되었습니다!');
      // Optionally, refresh the page or update UI to reflect new status
      window.location.reload(); // Simple reload to reflect status change
    }
  };

  return (
    <div className="absolute top-4 right-4 flex space-x-2">
      <button
        onClick={handleSave}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        저장
      </button>
      {scriptId && ( // Only show submit button if script is already saved (has an ID)
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

// --- ScriptEditor Page ---
export default function ScriptEditor() {
  const { scriptId } = useParams();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const [editorInstance, setEditorInstance] = useState(null);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMyScriptVisible, setIsMyScriptVisible] = useState(false);
  const [currentScriptStatus, setCurrentScriptStatus] = useState('draft'); // New state for script status
  const [isDirty, setIsDirty] = useState(false); // State to track unsaved changes
  const initialContentRef = useRef(null); // Ref to store the initial content

  useEffect(() => {
    if (!editorInstance || !supabase) return;

    const initializeEditor = async () => {
      setIsLoading(true);
      try {
        let initialContentJson;
        let scriptStatus = 'draft'; // Default status
        if (scriptId) {
          const { data, error } = await supabase
            .from('scripts')
            .select('title, content, status') // Select status as well
            .eq('id', scriptId)
            .single();
          if (error) throw error;
          if (data) {
            setTitle(data.title);
            initialContentJson = data.content;
            scriptStatus = data.status || 'draft'; // Use fetched status or default to 'draft'
          }
        } else {
          setTitle('제목없는 대본');
          initialContentJson = {root: {children: [{type: 'paragraph', children: []}], direction: null, format: '', indent: 0, type: 'root', version: 1}};
        }
        setCurrentScriptStatus(scriptStatus); // Set the status state
        const editorState = editorInstance.parseEditorState(initialContentJson);
        editorInstance.setEditorState(editorState);
        initialContentRef.current = JSON.stringify(initialContentJson);
        setIsDirty(false); // Reset dirty state on load
      } catch (e) {
        console.error("Failed to initialize editor:", e);
        setTitle("스크립트 불러오기 실패");
      } finally {
        setIsLoading(false);
      }
    };

    initializeEditor();
  }, [scriptId, editorInstance, supabase]);

  // Called when the editor content changes
  const handleOnChange = (editorState) => {
    if (!initialContentRef.current) return;
    const currentContent = JSON.stringify(editorState.toJSON());
    // Set dirty flag if content has changed from the initial state
    setIsDirty(currentContent !== initialContentRef.current);
  };

  // Called when a save is successful
  const handleSaveSuccess = (savedContent) => {
    initialContentRef.current = savedContent;
    setIsDirty(false);
  };

  // Handles navigation away from the editor
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
      const containerNode = $createScriptContainerNode(); // Correct: No Lexical. prefix
      const paragraphNode = Lexical.$createParagraphNode(); // Correct: From Lexical namespace
      const textNode = Lexical.$createTextNode(content); // Correct: From Lexical namespace
      paragraphNode.append(textNode);
      containerNode.append(paragraphNode);

      const selection = Lexical.$getSelection(); // Correct: From Lexical namespace
      if (Lexical.$isRangeSelection(selection)) {
        selection.insertNodes([containerNode]);
      } else {
        const root = Lexical.$getRoot(); // Correct: From Lexical namespace
        root.append(containerNode);
      }
      
      containerNode.selectEnd();
    });
  };



  return (
    <section className="w-full flex bg-[rgb(25,25,25)] min-h-screen">
      <div className="w-1/4 bg-slate-900 p-4 space-y-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2 text-white">예시 대본</h2>
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
      </div>

      <div className="flex-1 p-10 max-w-4xl mx-auto relative">
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-[rgb(25,25,25)] z-30">
            <p className="text-white">로딩 중...</p>
          </div>
        )}

        <div className="absolute top-4 right-28 flex space-x-2">
          <button
              onClick={() => setIsMyScriptVisible(!isMyScriptVisible)}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full transition-all duration-300"
              title="내 대본 목록"
          >
              <BookUser size={20} />
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setIsDirty(true); // Also mark as dirty when title changes
          }}
          placeholder="대본 제목을 입력하세요"
          className="text-3xl font-bold bg-transparent border-b-2 border-gray-700 focus:border-blue-500 outline-none w-full mb-6 text-white"
        />
        
        <Editor
          onReady={setEditorInstance}
          onChange={handleOnChange}
          customChildren={!isLoading && <SaveButton title={title} scriptId={scriptId} onSaveSuccess={handleSaveSuccess} currentStatus={currentScriptStatus} />}
        />
        />

        {isMyScriptVisible && (
            <div className="absolute top-0 right-0 h-full w-96 bg-gray-900 shadow-lg z-20 p-4 overflow-y-auto transition-all duration-300 ease-in-out">
                <button 
                    onClick={() => setIsMyScriptVisible(false)}
                    className="absolute top-3 right-3 text-white hover:scale-125 transition-transform"
                >&times;</button>
                <h2 className="text-xl font-bold text-white mb-4">내 대본</h2>
                <MyScript handleNavigate={handleNavigate} />
            </div>
        )}
      </div>
    </section>
  );
}