import { ElementNode } from 'lexical'; // Removed $getNodeByKey, createRoot, BlockManagementMenu import

export class ScriptContainerNode extends ElementNode {
  static getType() {
    return 'script-container';
  }

  static clone(node) {
    return new ScriptContainerNode(node.__key);
  }

  createDOM(config) {
    const dom = document.createElement('div');
    const className = config.theme.scriptContainer;
    if (className !== undefined) {
      dom.className = className;
    }
    dom.style.position = 'relative'; // Ensure positioning context for absolute children
    // Removed menuContainer creation and React rendering logic
    return dom;
  }

  updateDOM(prevNode, dom, config) {
    return false;
  }

  destroy() {
    // Simplified destroy method
    super.destroy();
  }

  static importJSON(serializedNode) {
    return new ScriptContainerNode();
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'script-container',
      version: 1,
    };
  }
}

export function $createScriptContainerNode() {
  return new ScriptContainerNode();
}

export function $isScriptContainerNode(node) {
  return node instanceof ScriptContainerNode;
}
