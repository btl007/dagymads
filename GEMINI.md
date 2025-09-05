# Gemini Project Context: wskcrw

This file summarizes the context of the `wskcrw` project for future sessions.

## Project Overview

- **Project Name:** wskcrw
- **Type:** Web application with a rich text editor.
- **Core Technologies:** React, Vite, Lexical.
- **Main Goal:** To create a Notion-like script editor where users can insert and manage blocks of text that are editable.

## Development Summary & Current Status

We initially attempted to create an editable block by using a custom `DecoratorNode` (`ScriptBlockNode`) that rendered a `LexicalNestedComposer` inside a React component (`ScriptBlockComponent`).

**Problem Encountered:**
This approach led to persistent and hard-to-debug circular dependency issues. The application would crash with an `Element type is invalid... got: undefined` error when trying to render the custom node. This happened because the main editor, while initializing its nodes, triggered a dependency chain that looped back on itself, causing a failure in the module loading (specifically for the `ContentEditable` component).

**New Architectural Decision:**
After extensive debugging, we decided to **abandon the `LexicalNestedComposer` approach** due to its complexity and inherent issues with circular dependencies in our setup.

The new, simpler architecture will be:
1.  **Use a custom `ElementNode` as a container:** We will create a new `ScriptContainerNode` that extends `ElementNode`. Its sole purpose is to act as a styled wrapper (e.g., providing a border and background) for its children.
2.  **Use standard nodes for content:** The actual text content will be a standard `ParagraphNode` placed *inside* the `ScriptContainerNode`. 
3.  **Leverage the main editor:** All text editing will be handled natively by the main editor, as the content is just a regular paragraph. This completely eliminates the need for a nested editor, state synchronization, and the associated complexity.

## Implementation Summary & Resolution

Based on the new architectural decision, the following steps were taken to refactor the editor:

1.  **Initial Change:** The insertion logic in `scriptEditor.jsx` was temporarily modified to insert a standard `ParagraphNode` to quickly move away from the problematic custom node.
2.  **Code Cleanup:** The obsolete `ScriptBlockNode.jsx` and `ScriptBlockComponent.jsx` files, which were responsible for the nested editor approach, were deleted. All references to these components were removed from `Editor.jsx`.
3.  **New Node Implementation:** A new `ScriptContainerNode.jsx` was created. This node extends `ElementNode` and acts as a simple, non-editable, styled container for other nodes.
4.  **Editor Integration:** The new `ScriptContainerNode` was registered in the `Editor.jsx` configuration, and a theme was applied to give it a distinct visual style (background, padding, etc.).
5.  **Final Insertion Logic:** The logic in `scriptEditor.jsx` was updated to insert a `ScriptContainerNode` containing a `ParagraphNode` with the script's content. This completed the new architecture.

**Follow-up Bug Fix:**- **Problem:** A new issue was identified where inserting a second block caused it to be indented inside the first block. - **Cause:** This was due to the editor's selection remaining *inside* the first container after insertion. The subsequent insertion was happening in a nested context, causing Lexical to auto-indent the new block.- **Resolution:** The insertion logic was made more robust. It now explicitly finds the top-level block containing the cursor, 'escapes' it, and inserts the new block as a sibling, not a child. This definitively solves the nesting and indentation issue.

---
## Completed Sprints

### Sprint 2: 마이페이지 및 에디터 통합 (2025년 9월 4일 완료)

**목표:** 사용자 '마이페이지'를 구현하여 대본을 조회, 편집, 삭제하고, 에디터의 안정적인 로딩을 보장합니다.

**구현된 주요 기능:**

*   **마이페이지 오버레이 (`MyScript.jsx`):
    *   에디터 우측에 토글 가능한 오버레이 패널로 구현.
    *   사용자 대본 목록 조회 및 표시 (제목, 한 줄 미리보기, 최종 수정 시간).
    *   대본 삭제 기능 추가 (확인 알림 포함).
*   **에디터 (scriptEditor.jsx) 기능 개선:**
    *   **URL 기반 대본 로딩:** `/editor` (새 글) 또는 `/editor/스크립트ID` (기존 글 수정) 경로에 따라 대본을 정확히 로드.
    *   **저장되지 않은 변경사항 경고:** 에디터 내용 수정 후 저장하지 않고 앱 내부에서 다른 페이지로 이동 시 경고창 표시.
    *   **좌측 예시 대본 목록 기능 복원:** 클릭 시 에디터에 내용 삽입 기능 복구.
*   **핵심 버그 해결 및 아키텍처 개선:**
    *   **Supabase RLS `uuid` 오류 최종 해결:**
        *   **원인:** Supabase의 `auth.jwt() ->> 'sub'` 클레임이 `uuid` 타입으로 잘못 해석되는 내부적인 '마법' 같은 동작 때문이었음.
        *   **해결:** Clerk JWT 템플릿에 `user_id: "{{user.id}}"` 커스텀 클레임을 추가하고, RLS 정책을 `auth.jwt() ->> 'user_id'` 기반으로 수정하여 `TEXT` 타입 비교를 강제함.
    *   **에디터 로딩/렌더링 문제 해결:**
        *   **원인:** `useEffect` 내에서 `editorInstance`를 기다리면서 로딩 화면이 에디터 렌더링을 막는 '닭-달걀' 문제 발생.
        *   **해결:** `Editor.jsx`에 `onReady` 콜백을 복원하고, `scriptEditor.jsx`에서 `editorInstance.setEditorState()`를 사용하여 에디터 내용을 명령적으로 업데이트하는 방식으로 전환. 로딩 오버레이는 에디터 렌더링을 막지 않도록 수정.
    *   **Clerk `<SignedIn>` 충돌:** `react-router-dom`의 동적 파라미터와 `<SignedIn>` 컴포넌트 간의 충돌 확인. 임시적으로 `<SignedIn>` 래퍼를 제거하여 해결 (보안은 RLS에 위임).
    *   **`updated_at` 컬럼 누락:** 누락된 `updated_at` 컬럼 및 자동 업데이트 트리거 추가.

**결과:**

*   핵심 대본 관리 기능 (생성, 목록 조회, 편집, 삭제)이 이제 완벽하게 작동하고 안정적입니다.
*   사용자 경험을 개선하는 '저장되지 않은 변경사항' 경고 기능이 추가되었습니다.
*   복잡했던 에디터 초기화 및 데이터 연동 문제가 해결되어, 향후 기능 확장의 기반이 마련되었습니다.