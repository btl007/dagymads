import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'; // Import OnChangePlugin
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getRoot,
} from 'lexical';
import { $getNearestNodeOfType } from '@lexical/utils';
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BlockManagementMenu } from '../components/BlockManagementMenu';
import { $createScriptContainerNode, $isScriptContainerNode, ScriptContainerNode } from '../nodes/ScriptContainerNode';

// This plugin calls the onReady callback when the editor is ready.
function OnReadyPlugin({ onReady }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (onReady) {
      onReady(editor);
    }
  }, [editor, onReady]);
  return null;
}

// Handles pressing the Enter key to create new script blocks.
function EnterKeyPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (event.shiftKey) return false; // Allow shift+enter for line breaks

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const anchorNode = selection.anchor.getNode();
        const scriptContainerNode = $getNearestNodeOfType(anchorNode, ScriptContainerNode);

        if (scriptContainerNode) {
          editor.update(() => {
            const newScriptContainerNode = $createScriptContainerNode();
            const newParagraphNode = $createParagraphNode();
            newScriptContainerNode.append(newParagraphNode);
            scriptContainerNode.insertAfter(newScriptContainerNode);
            newParagraphNode.selectStart();
          });
          event.preventDefault();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  return null;
}

// Renders the hover menu for script blocks.
function BlockManagementMenuPortal({ editor, nodeKey }) {
  const [domElement, setDomElement] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  const show = () => {
    clearTimeout(timerRef.current);
    setIsHovered(true);
  };

  const hide = () => {
    timerRef.current = setTimeout(() => setIsHovered(false), 100);
  };

  useEffect(() => {
    const element = editor.getElementByKey(nodeKey);
    setDomElement(element);
  }, [editor, nodeKey]);

  useEffect(() => {
    if (!domElement) return;
    domElement.addEventListener('mouseenter', show);
    domElement.addEventListener('mouseleave', hide);
    return () => {
      domElement.removeEventListener('mouseenter', show);
      domElement.removeEventListener('mouseleave', hide);
    };
  }, [domElement]);

  if (!domElement) return null;

  const rect = domElement.getBoundingClientRect();

  return isHovered
    ? createPortal(
        <BlockManagementMenu
          editor={editor}
          nodeKey={nodeKey}
          rect={rect}
          show={show}
          hide={hide}
        />,
        document.body
      )
    : null;
}

// Finds all script blocks and renders a portal menu for each.
function BlockManagementRendererPlugin() {
  const [editor] = useLexicalComposerContext();
  const [nodeKeys, setNodeKeys] = useState([]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const newKeys = [];
        const root = $getRoot();
        root.getChildren().forEach((node) => {
          if ($isScriptContainerNode(node)) {
            newKeys.push(node.getKey());
          }
        });
        if (JSON.stringify(newKeys) !== JSON.stringify(nodeKeys)) {
          setNodeKeys(newKeys);
        }
      });
    });
  }, [editor, nodeKeys]);

  return (
    <>
      {nodeKeys.map((key) => (
        <BlockManagementMenuPortal key={key} editor={editor} nodeKey={key} />
      ))}
    </>
  );
}


export default function Editor({ initialState, onReady, onChange, customChildren }) {
  const initialConfig = {
    namespace: 'WskcrwEditor',
    theme: {
      paragraph: 'text-base text-white',
      scriptContainer: 'script-container bg-[rgb(25,25,25)] rounded-lg px-4 py-1',
    },
    onError: (error) => {
      console.error('Lexical Error:', error);
    },
    nodes: [ScriptContainerNode],
    editorState: initialState,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative p-4 rounded-lg bg-[rgb(25,25,25)] min-h-[300px]">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="outline-none w-full text-[rgb(212,212,212)] min-h-[250px]" />
          }
          placeholder={
            <div className="text-gray-500 absolute top-4 left-4 pointer-events-none">
              <span className="block">💡 여기에 입력하세요</span>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={onChange} />
        <OnReadyPlugin onReady={onReady} />
        <EnterKeyPlugin />
        <BlockManagementRendererPlugin />
        {customChildren}
      </div>
    </LexicalComposer>
  );
}
