import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import { Trash2, Copy } from 'lucide-react'; // Assuming lucide-react is installed

export function BlockManagementMenu({ editor, nodeKey, rect, show, hide }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const handleToggleMenu = (event) => {
    event.stopPropagation(); // Prevent Lexical from handling the click
    setShowMenu((prev) => !prev);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    editor.update(() => {
      const nodeToRemove = $getNodeByKey(nodeKey);
      if (nodeToRemove) {
        nodeToRemove.remove();
      }
    });
    setShowMenu(false); // Close menu after action
  };

  const handleDuplicate = (event) => {
    event.stopPropagation();
    editor.update(() => {
      const nodeToDuplicate = $getNodeByKey(nodeKey);
      if (nodeToDuplicate) {
        const clonedNode = nodeToDuplicate.clone();
        nodeToDuplicate.insertAfter(clonedNode);
      }
    });
    setShowMenu(false); // Close menu after action
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const menuStyle = {
    position: 'fixed',
    top: `${rect.top + rect.height / 2}px`,
    left: `${rect.left - 40}px`,
    transform: 'translateY(-50%)',
    zIndex: 110, // High z-index to be on top of everything
    opacity: 1,
  };

  return (
    <div
      style={menuStyle}
      ref={menuRef}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button className="block-management-toggle-button" onClick={handleToggleMenu}>
        ...
      </button>

      {showMenu && (
        <div className="block-management-dropdown">
          <button className="block-management-option" onClick={handleDuplicate}>
            <Copy size={16} /> 복제
          </button>
          <button className="block-management-option" onClick={handleDelete}>
            <Trash2 size={16} /> 삭제
          </button>
        </div>
      )}
    </div>
  );
}