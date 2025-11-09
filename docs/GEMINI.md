# Gemini Project Context: dagymads

This file summarizes the context of the `dagymads` project for future sessions.

## Project Overview

- **Project Name:** dagymads
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

## Sprint Information

For detailed sprint information, please refer to [sprint.md](./sprint.md).

---

## dagymads Project Migration Summary

This document summarizes the migration steps performed to transition the project from `wskcrw` to `dagymads`.

### 1. Project Renaming and Scope Adjustment
- The project name has been officially changed from `wskcrw` to `dagymads`.
- The focus has shifted from `wskcrw` homepage functionalities to `dagymads` related features.

### 2. Codebase Modifications
- **`src/pages/Works.jsx`:** This file was deleted as it was no longer required for the `dagymads` project.
- **`src/components/Header.jsx`:** The navigation menu items 'About', 'Works', and 'Contact' were removed from the `menuItems` array. Only 'DagymGuide' and 'ScriptEditor' remain.
- **`index.html`:** The HTML meta title was updated from 'WSKCRW' to '다짐 광고 센터'.

### 3. Git Repository Setup
- The existing `.git` directory was removed to clear previous Git history.
- A new Git repository was initialized in the project root (`/Users/gimjinhyeong/Desktop/dagymads/`).
- All current project files were added to the staging area.
- An initial commit with the message "feat: Initial commit for dagymads project" was made.
- The local repository was connected to a new remote GitHub repository: `https://github.com/btl007/dagymads.git`.
- The `main` branch was successfully pushed to the new remote repository.

### 4. External Service Updates (User Action Required/Completed)
- **Supabase:** The project name in Supabase was manually updated by the user.
- **Clerk:** The project name in Clerk was manually updated by the user.

Further steps may involve updating configuration files within the codebase to reflect any new Supabase URLs, API keys, or Clerk environment variables, if applicable.

---

## Architectural Pivot: Video Production Management SaaS

Based on user feedback and clarification of business goals, the project has pivoted from a simple script editor to a more comprehensive SaaS platform for managing the video production lifecycle for various fitness centers ("센터").

### Core Concept

- The central entity is now the **Project**, which represents a single video production for a Center.
- The Admin Dashboard is the primary interface for Dajim HQ to manage the status of all ongoing projects.
- The workflow is designed to streamline communication and processes between Dajim's internal teams (Sales, Marketing) and the client (Center).

### Key Architectural Changes

1.  **Database Schema Redesign:**
    *   A new `projects` table was created to store project-specific information like `name`, `status`, and `frame_io_link`.
    *   The `scripts` table was altered to include a `project_id`, establishing a one-to-many relationship between projects and scripts.
    *   Following the `forSupabase.md` guide, all `user_id` references are correctly typed as `TEXT` to match Clerk's user IDs, preventing type-mismatch errors.

2.  **Backend Logic Automation:**
    *   The `create-clerk-user` Edge Function was updated significantly.
    *   Now, when an admin creates a new Center (user), the system automatically creates an associated initial **Project** for that user in the `projects` table.
    *   This change provides a seamless UX for the admin (one action) while maintaining a robust and scalable 1:N database structure on the backend.
    *   Rollback logic was added to delete the Clerk user if the subsequent project creation fails, ensuring data consistency.

3.  **Admin Dashboard Overhaul:**
    *   The dashboard was redesigned to serve two distinct purposes.
    *   **Project Kanban View:** The top of the dashboard now features a Kanban board that displays all projects, organized into columns by their current status (e.g., '대본 필요', '대본 접수', '영상 초안'). This provides an at-a-glance overview of the entire production pipeline.
    *   **Detailed Column View:** The original 3-column view (Center -> Scripts -> Script Detail) is preserved below the Kanban board for detailed lookup and archival purposes.

4.  **Major UI/UX Refinement:**
    *   **Unified Dark Theme:** The entire application now has a consistent and polished dark theme.
    *   **Flexible Editor Layout:** The `scriptEditor` page was refactored to feature collapsible left and right side panels with smooth animations, allowing users to customize their workspace.
    *   **Component Polish:** Key components like the script list (`MyScript.jsx`) were redesigned into a card-based format with clear status badges for better readability.

---

## Architectural Refinement & Bug Fixing (Sept 12, 2025)

This phase focused on refining the data model for a more organic user experience and fixing several critical bugs related to authentication and data fetching.

### 1. Data Model & Workflow Refinement

- **Problem:** The initial SaaS architecture had `Projects` and `Scripts` independently linked to a `User`, creating ambiguity. When a user submitted a script, it was unclear which project should be updated.
- **Solution:** A direct `Project -> Script` relationship was established by adding a `project_id` to the `scripts` table.
- **Automatic Association:** To maintain a simple UX for the client ("Center"), a new logic was implemented. When a user saves a script, the system automatically finds the user's most recent project and associates the script with it, eliminating the need for manual project selection.
- **Organic Status Flow:** With the new data model, the client's action of "submitting" a script now correctly and automatically updates the status of its parent project to `script_submitted`.

### 2. Admin Dashboard UI/UX Enhancements

- **Project Card Redesign:** The Kanban cards were overhauled to display more relevant information at a glance: Center Name (as a primary, clickable element), Project Name, creation month, and days elapsed since creation.
- **4-Column Detail View:** The admin's detail view was expanded from 3 to 4 columns ([All Centers] - [Center Detail] - [Submitted Scripts] - [Script Detail]) for a more organized and comprehensive data presentation.
- **Interactive Kanban:** The Kanban board was made interactive; clicking a center's name on a card now automatically filters the 4-column detail view to that specific center.

### 3. Critical Bug Fixes

- **`JWT expired` Error:** This critical authentication bug was resolved by re-implementing the `SupabaseProvider`. The provider now dynamically furnishes a fresh Clerk auth token for every single API request, rather than using a static token that would expire.
- **`get-all-clerk-users` Edge Function:** A series of bugs (CORS, HTTP Method, SDK response handling) in this function were systematically debugged and fixed. This function is now used to reliably fetch Clerk `usernames` for display in the admin UI.

---

## Admin Dashboard Refactor & Feature Expansion (Sept 13, 2025)

This session involved a major refactoring of the Admin Dashboard to improve its structure, scalability, and user experience by integrating the `shadcn/ui` component library.

### 1. `shadcn/ui` Integration

- **Installation & Setup:** Installed the `shadcn/ui` library and its dependencies. This involved creating a `jsconfig.json` for path aliasing and debugging several installation issues related to component dependencies (`resizable`, `badge`) and React context (`SidebarProvider`).
- **UI Enhancement:** Used `shadcn/ui` components to build a professional and consistent UI, including `Table`, `Badge`, and a full sidebar layout.
- **Dark Mode:** Implemented a persistent dark mode for the entire application by default.

### 2. Nested Routing and Layout Abstraction

- **Problem:** The main `AdminDashboard` component was monolithic, containing the logic and UI for the Kanban board, a detailed 4-column view, and various forms. This made it difficult to manage and scale.
- **Solution:** The dashboard was refactored to use a nested routing strategy provided by React Router.
  - **`AdminLayout.jsx`:** A new layout component was created to house the shared UI, primarily the `shadcn/ui` sidebar and the main content panel wrapper. It uses `<Outlet />` to render child routes.
  - **Componentization:** The monolithic dashboard was broken down into smaller, single-purpose page components:
    - `AdminOverview.jsx`: The main landing page for the admin section.
    - `AdminKanban.jsx`: A dedicated page showing only the project Kanban board.
    - `AdminScript.jsx`: A dedicated page for the detailed 4-column script view.
    - `AdminUsers.jsx`: A page listing all users and providing a link to create new ones.
    - `AdminProject.jsx`: A new page that displays all projects in a comprehensive table view.
    - `AdminCreateUser.jsx` & `AdminCreateProject.jsx`: Dedicated pages for the creation forms.
- **Scalability:** This new structure makes it significantly easier to add or modify individual sections of the admin dashboard without affecting others.

### 3. Backend Schema Extension

- To support new features, the Supabase database schema was extended:
  - **`user_profiles` table:** Added an `address` (type `TEXT`) column to store center addresses.
  - **`projects` table:** Added a `shootdate` (type `DATE`) column to store the planned shooting date for a project.
- The corresponding `ALTER TABLE` SQL statements were generated and provided for execution in the Supabase SQL Editor.

---

## Admin Calendar Feature & Component Refactor (Sept 14, 2025)

This session focused on implementing a significant new feature for the admin dashboard—a calendar for managing project shoot dates—and subsequently refactoring it for reusability after a lengthy debugging process.

### 1. Feature Implementation: Shoot Date Calendar

- **New UI (`AdminVideo.jsx`):** A new page was created featuring a two-panel layout. The left panel displays a calendar, and the right panel displays details for a selected date.
- **Data Visualization:** The calendar visually indicates which dates have scheduled shoots by rendering a dot beneath the day number.
- **Interactive Management:**
  - Clicking a date on the calendar filters and displays the list of projects scheduled for that day.
  - Clicking a project in the list opens a `Dialog` modal.
  - Inside the modal, the admin can select a new `shootdate` and save the change to the database.
  - A `Toast` notification confirms the successful update, and the UI automatically refreshes to reflect the change.

### 2. Critical Bug Resolution

- **The Problem:** A persistent and mysterious bug prevented any data from being fetched within `AdminVideo.jsx`, while other admin pages worked correctly. This meant neither the dots on the calendar nor the project details would appear.
- **Debugging Journey:** The issue was systematically investigated, ruling out RLS policies, database-to-client data formatting, and component hierarchy issues.
- **Root Cause:** The bug was finally isolated to a single line of code. The `useSupabase` custom hook was being used incorrectly with object destructuring (`const { supabase } = useSupabase()`) instead of direct assignment (`const supabase = useSupabase()`). This caused the `supabase` client instance to be `undefined` exclusively within this component, preventing all database operations.
- **Resolution:** Correcting the hook usage immediately resolved all data-fetching issues.

### 3. Architectural Improvement: Component Refactoring

- **Motivation:** Recognizing that a calendar with highlighted dates could be used elsewhere, the decision was made to abstract the functionality.
- **`CustomCalendar.jsx`:** A new, generic presentational component was created.
  - It is unaware of business logic like "projects" or "shoots."
  - It accepts a `highlightedDates` prop (an array of `Date` objects) to render a visual indicator on any given date.
- **Separation of Concerns:** `AdminVideo.jsx` now retains the business logic (fetching projects, preparing the `shootdate` array) and passes the necessary data as props to the reusable `CustomCalendar` component. This improves maintainability and code reuse.

---

## Recent Development Log (Sept 19, 2025)

This log summarizes the recent development efforts, focusing on enhancing the Admin Dashboard's data display and interaction.

### 1. AdminKanban.jsx Refactoring & Debugging

-   **Initial Problem:** `ColumnContainer` and `TaskCard` components were imported but not created, leading to errors.
    -   **Resolution:** Created `src/components/ColumnContainer.jsx` and `src/components/TaskCard.jsx` to provide the necessary UI elements for the Kanban board.
-   **Dependency Installation:** Encountered `Failed to resolve import "@dnd-kit/core"` errors.
    -   **Resolution:** Installed missing `@dnd-kit/core` and `@dnd-kit/sortable` packages.
-   **Vite Cache Issue:** Faced `net::ERR_ABORTED 504 (Outdated Optimize Dep)` error.
    -   **Resolution:** Cleared Vite's dependency cache by deleting `node_modules/.vite` to force re-bundling.
-   **Data Loading Bug (Empty Column):** The "대본 필요" column was empty, and a `TypeError: Cannot destructure property 'supabase' of 'useSupabase(...)' as it is undefined` error was identified.
    -   **Resolution:** Fixed the `useSupabase()` hook call in `AdminKanban.jsx` from `const { supabase } = useSupabase()` to `const supabase = useSupabase()`, resolving the `undefined` client issue.
-   **User Data Fetching Strategy:** Initial attempts to fetch "Center Name" (Clerk `UserName`) via Supabase joins were incorrect.
    -   **Resolution:** After analyzing other admin files (`AdminProject`, `AdminScript`, `AdminVideo`), it was confirmed that `useUserCache` is the standard project pattern for fetching `UserName` from Clerk. `AdminKanban.jsx` was refactored to use `useUserCache` for this purpose.
-   **Import Path Correction:** `Failed to resolve import "../../contexts/UserCacheContext"` error due to an incorrect relative path.
    -   **Resolution:** Corrected the import path for `UserCacheContext` in both `AdminKanban.jsx` and `TaskCard.jsx`.
-   **Context Provider Issue:** `TypeError: Cannot destructure property 'userCache' of 'useUserCache(...)' as it is undefined` because `AdminLayout` was not wrapped in `UserCacheProvider`.
    -   **Resolution:** Wrapped the `AdminLayout` component with `UserCacheProvider` in `App.jsx` to ensure all admin routes have access to the user cache context.
-   **TaskCard UI Update:** Implemented detailed UI changes for `TaskCard.jsx` as requested by the user.
    -   **Resolution:** The card's main title now displays the Center Name (Clerk `UserName`). The top-right corner shows "D+{daysElapsed}일" in a badge format. The card content includes "생성일: YYYY-MM-DD", "센터 담당자: member_name", and "프로젝트명: project_name". To support "센터 담당자: member_name", the `AdminKanban.jsx` Supabase query was updated to `select('*, user_profiles(member_name)')`.

### 2. AdminProject.jsx Refactoring

-   **Problem:** `AdminProject.jsx` used a complex, manual data fetching method and contained the same `useSupabase()` bug found elsewhere.
    -   **Resolution:** Refactored `AdminProject.jsx` to align with the established `useUserCache` pattern for consistency and simplicity.
        -   Corrected `useSupabase()` hook usage.
        -   Integrated `useUserCache` for fetching and displaying `UserName` (Center Name).
        -   The Supabase query was updated to `select('*, user_profiles(member_name, phone_number)')` to efficiently retrieve `member_name` and `phone_number`.
        -   Fixed `project.project_name` to `project.name` in the JSX for project names.
        -   Restructured the project table to include new columns: "번호", "센터명", "프로젝트명", "센터 담당자", "담당자 연락처", "촬영일자", "상태" (Korean label from `STATUS_MAP`), and a "더보기" button to open the `ProjectInfoModal`.

### 3. ProjectInfoModal.jsx Refactoring

-   **Problem:** The `ProjectInfoModal` was stuck on a loading state and failed to display data.
    -   **Root Cause:** The modal was performing redundant internal data fetching, expected a `projectId` prop but received a `project` object, and had an incorrect `useSupabase()` hook usage.
    -   **Resolution:** Refactored `ProjectInfoModal.jsx` into a "dumb" presentational component.
        -   Removed all internal data fetching logic and associated state.
        -   Corrected `useSupabase()` hook usage.
        -   Modified component props to directly receive the complete `project` object.
        -   Editable state variables are now initialized from the `project` prop using a `useEffect`.
        -   The `handleSave` function was updated to correctly use `project.id` and `project.user_id` from the received `project` prop.

---

## 최근 UI/UX 리팩토링 로그 (2025년 9월 19일)
이 로그는 최근 UI/UX 리팩토링 노력을 요약하며, 애플리케이션 전반의 사용자 경험 및 일관성 향상에 중점을 둡니다.
    ### 1. AdminLayout.jsx 리팩토링
    
    -   **목표:** 메인 관리자 레이아웃, 특히 사이드바 및 상호작용 개선.
    -   **변경 사항:**
        -   `ResizablePanelGroup` 및 관련 컴포넌트를 제거하고, 더 간단한 Flexbox 기반 레이아웃을 채택했습니다.
        -   사이드바의 너비와 메인 콘텐츠의 여백을 제어하기 위해 `SidebarProvider`의 `open` 상태를 통합하여 Notion과 같은 축소(아이콘만 있는 얇은 바)를 가능하게 했습니다.
        -   사이드바의 확장/축소 상태를 제어하는 `SidebarTrigger` (토글 버튼)를 추가했습니다.
        -   메인 콘텐츠 영역에 `SidebarTrigger`, 정적 페이지 제목("Admin Dashboard"), Clerk `UserButton`을 포함하는 기본 툴바를 추가했습니다.
    -   **해결:** 기능적인 축소 사이드바를 통해 더욱 간소화되고 일관된 관리자 레이아웃을 구현했습니다.
   
   ### 2. Header.jsx 리팩토링 (되돌림)
   
    -   **목표:** 초기에는 전역 `Header.jsx` 스타일을 SaaS 애플리케이션에 더 적합하도록 간소화하려고 시도했습니다.
    -   **변경 사항:**
        -   `backdrop-blur` 및 플로팅 스타일을 제거하고 표준적인 전체 너비 고정 헤더로 대체하려고 시도했습니다. 
        -   **되돌림:** 사용자 피드백에 따라 `Header.jsx`에 대한 모든 변경 사항을 되돌려 원래 상태로 복원했습니다.
   
   ### 3. main.jsx 및 App.jsx (되돌림)
   
    -   **목표:** 초기에는 `BrowserRouter`를 `main.jsx`로 이동하고, 라우트에 따라 `App.jsx`에서 `Header`를 조건부로 렌더링하려고 시도했습니다.
    -   **발생한 문제:**
        -   `Router` 중첩 문제로 인한 `App.jsx`의 `useLocation()` 오류.
        -   `BrowserRouter`가 "데이터 라우터"가 아니어서 `AdminLayout.jsx`의 `useMatches()` 오류.
    -   **되돌림:** 라우팅 관련 오류를 해결하고 디버깅 프로세스를 단순화하기 위해 `main.jsx` 및 `App.jsx`에 대한 모든 변경 사항을 되돌려 원래 상태로 복원했습니다.
   
    ### 4. AdminKanban.jsx 리팩토링
   
    -   **목표:** 칸반 보드의 시각적 명확성 및 사용자 경험 개선.
    -   **변경 사항:**
        -   **컬럼 스타일링 (`ColumnContainer.jsx`):** `shadcn/ui` `Card` 컴포넌트를 사용하도록 리팩토링했습니다. `TaskCard`와의 시각적 구분을 위해 배경을 `bg-card`에서 `bg-muted`로 변경했습니다.
        -   **태스크 카드 스타일링 (`TaskCard.jsx`):**
      `shadcn/ui` `Card` 컴포넌트 및 테마를 고려한 색상을사용하도록 리팩토링했습니다. `ColumnContainer`의 태스크 개수 배지는 일관성을 위해 `TaskCard`의 배경(`bg-card`)과 일치하도록 업데이트되었습니다.
        -   **프로젝트 정보 모달 통합:**
            -   각 `TaskCard`에 상세 모달을 여는 "편집" 버튼(PencilIcon)을 추가했습니다.
            -   모달을 제어하기 위해 `AdminKanban.jsx`에 상태 관리(`isModalOpen`, `selectedProject`)를 구현했습니다.
            -   `AdminKanban.jsx`에서 `shadcn/ui` `Dialog` 및 `DialogContent` 내부에 `ProjectInfoModal`을 통합했습니다.
            -   모달 데이터 및 업데이트를 관리하기 위해 `handleViewDetails` 및 `handleProjectSave` 함수를 구현했습니다.
            -   모달 내 접근성을 위해 `DialogHeader`, `DialogTitle`, `DialogDescription`을 추가했습니다.
    -   **해결:** 칸반 보드의 시각적 매력과 상호작용성을 크게 향상시켜 사용자가 태스크 카드에서 직접 프로젝트 세부 정보를 보고 편집할 수 있도록 했습니다.
   
    ### 5. ProjectInfoModal.jsx 리팩토링
   
    -   **목표:** `ProjectInfoModal.jsx`를 내부 `Dialog` 래퍼를 제거하여 재사용 가능한 콘텐츠 전용 컴포넌트로 리팩토링.
    -   **변경 사항:**
        -   `Dialog` 및 `DialogContent` 임포트를 제거했습니다.
        -   컴포넌트 프롭에서 `isOpen` 및 `onClose`를 제거했습니다.
        -   컴포넌트의 `return` 문을 모달의 콘텐츠를 직접 반환하도록 수정했습니다 (React Fragment `<>...</>`로 래핑).
        -   모달 닫기가 이제 부모에서 처리되므로 `handleSave` 에서 `onClose()` 호출 및 "취소" 버튼에서 `onClick={onClose}`를 제거했습니다.
        -   `export default` 문 및 후행 세미콜론과 관련된 구문 오류를 수정했습니다.
    -   **해결:** `ProjectInfoModal`은 이제 "dumb" 컴포넌트가 되어 재사용성이 높아졌으며 `AdminKanban.jsx` 및 `AdminProject.jsx`에 올바르게 통합되었습니다.
   
    ### 6. AdminProject.jsx 리팩토링
   
    -   **목표:** 리팩토링된 `ProjectInfoModal`을 `AdminProject` 페이지에 올바르게 통합.
    -   **변경 사항:**
        -   `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` 임포트를 추가했습니다.
        -   `AdminProject.jsx`에서 `ProjectInfoModal`을 `Dialog` 및 `DialogContent`로 래핑하고 `open={isModalOpen}` 및 `onOpenChange={setIsModalOpen}`을 전달했습니다.
        -   모달에서 프로젝트 업데이트를 처리하기 위해 `handleProjectSave` 함수를 구현했습니다.
        -   `project`, `onClose`, `onSave`, `userName` 프롭이 `ProjectInfoModal`에 올바르게 전달되도록 했습니다.
    -   **해결:** `AdminProject`는 이제 오류 없이 `ProjectInfoModal`을 올바르게 열고 표시하며 `AdminKanban.jsx`와의 일관성을 유지합니다.
   
    ### 7. AdminVideo.jsx 리팩토링
   
    -   **목표:** 오른쪽 패널이 월별 보기를 기반으로 프로젝트 데이터를 표시하도록 리팩토링.
    -   **변경 사항:**
        -   `projectsOnSelectedDate` 대신 `projectsInSelectedMonth`를 표시하도록 필터링 로직을 수정했습니다.
        -   오른쪽 패널의 `CardTitle`을 선택된 월을 반영하도록 업데이트했습니다 (예: "YYYY년 MM월 촬영 정보").
        -   누락된 `useMemo` 임포트를 수정했습니다.
    -   **해결:** `AdminVideo` 페이지는 이제 프로젝트의 월별 개요를 제공하여 유용성을 향상시켰습니다.

## 스케줄링 시스템 개발 및 아키텍처 리팩토링 (2025-09-22)

이 세션에서는 관리자가 촬영 스케줄을 관리하는 새로운 기능 개발을 진행했습니다. 이 과정에서 반복적인 인증 오류를 해결하고, 그 결과로 프로젝트의 백엔드 호출 아키텍처를 리팩토링했습니다.

### 1. 기능 기획 및 백엔드 구현

-   **요구사항 정의:** `whattime.md` 기술 명세서를 통해, 1시간 단위의 시간 슬롯을 미리 생성하고 관리하는 'Pre-generated Slot' 모델의 스케줄링 시스템을 기획했습니다.
-   **초기 구현 (Edge Function):** `get-all-slots`, `manual-generate-slots` 등 핵심 로직을 Supabase Edge Function으로 구현했습니다.
-   **데이터베이스:** `time_slots` 테이블 스키마를 정의하고, 관련 로직을 처리하는 SQL 함수(`generate_slots_for_date` 등)를 작성했습니다.

### 2. 401/403 인증 오류 디버깅

-   **문제 발생:** 클라이언트 UI(`AdminSchedule.jsx`)에서 `supabase.functions.invoke()`를 통해 Edge Function을 호출할 때, 지속적으로 401 Unauthorized 또는 403 Forbidden 오류가 발생했습니다.
-   **원인 분석:**
    1.  **`functions.invoke` 인증 문제:** `supabase.from().select()`나 `supabase.rpc()` 호출은 정상적으로 인증되는 반면, `functions.invoke()` 호출 시에만 인증 토큰 전달이 일관되게 이루어지지 않는 현상을 발견했습니다.
    2.  **JWT 클레임 누락:** Clerk에서 Supabase로 전달하는 JWT에 `public_metadata`가 기본적으로 포함되지 않아, Edge Function 내부에서 `is_admin` 권한을 확인할 수 없는 문제를 추가로 발견했습니다.
-   **디버깅 과정:** Edge Function 내부에 `console.log`를 추가하여, 함수가 받는 `user` 객체가 `null`이거나 `user_metadata`가 비어있음을 확인함으로써 원인을 최종적으로 특정했습니다.

### 3. 아키텍처 리팩토링 및 문제 해결

-   **`invoke` -> `rpc` 전환:** 고질적인 인증 문제를 해결하기 위해, 클라이언트에서 호출하는 모든 백엔드 로직을 Edge Function이 아닌 **SQL RPC 함수**로 전환하는 결정을 내렸습니다. 클라이언트는 `supabase.rpc()`를 통해 안정적으로 인증되는 함수를 호출합니다.
-   **Clerk JWT 템플릿 수정:** 관리자 권한 확인을 위해 Clerk의 Supabase용 JWT 템플릿에 `public_metadata` 클레임을 추가하도록 가이드했습니다.
-   **문서화:** 이 모든 문제 해결 과정을 `forSupabase.md`에 상세히 기록하여, 향후 유사한 문제를 방지하도록 했습니다.

### 4. UI 구현

-   **`AdminSchedule.jsx` 페이지 구현:** 리팩토링된 RPC 아키텍처를 기반으로, 관리자가 슬롯의 예약 가능 여부(`is_open`)를 관리하는 UI 페이지를 최종적으로 완성했습니다.


## 스케줄링 시스템 완성 및 UI/UX 리팩토링 (2025-09-24)

이번 세션에서는 사용자-관리자 간의 양방향 스케줄링 시스템을 완성하고, 그 과정에서 발견된 여러 버그를 해결했으며, 전반적인 UI/UX를 크게 개선했습니다.

### 1. 핵심 기능 구현: 양방향 스케줄링 시스템

-   **사용자 예약 요청:**
    -   사용자가 `scriptEditor` 페이지를 벗어나지 않고 촬영일을 예약할 수 있도록, `UserScheduleModal` 컴포넌트를 구현하여 통합된 사용자 경험을 제공했습니다.
    -   사용자에게는 관리자가 오픈한 시간만 노출되도록, 보안을 고려한 `get_available_slots` RPC 함수를 별도로 생성했습니다.
    -   사용자의 예약 요청을 처리하기 위해 `request_schedule_slots` RPC 함수를 구현했습니다.

-   **관리자 예약 승인/거절:**
    -   `AdminVideo` 페이지에 '승인 대기 중인 예약' 섹션을 추가하여, 관리자가 모든 예약 요청을 한눈에 보고 '승인' 또는 '거절'할 수 있는 워크플로우를 완성했습니다.
    -   이 기능을 위해 `get_pending_requests`, `deny_schedule_slot` 등 신규 RPC 함수를 추가하고, 기존의 `confirm_schedule_slot` 함수와 연동했습니다.

### 2. UI/UX 리팩토링 및 개선

-   **`scriptEditor.jsx` 개선:**
    -   여러 곳에 흩어져 있던 버튼들을 페이지 상단의 **통합 툴바**로 재배치하여 UI를 깔끔하게 정리했습니다.
    -   툴바에 현재 **프로젝트의 상태**와 **확정된 촬영 일시**를 항상 표시하여, 사용자가 페이지를 벗어나지 않고도 핵심 정보를 파악할 수 있도록 개선했습니다.

-   **`ProjectInfoModal.jsx` 리팩토링:**
    -   더 이상 사용하지 않는 '일정 조율' 탭과 필드들을 과감히 제거하고, 전체적인 레이아웃을 단순화하여 정보의 가독성을 높였습니다.
    -   **(중요)** 모달의 저장 로직을 부모 컴포넌트(`AdminKanban` 등)가 책임지도록 구조를 변경하여, 모달에서 저장 후 부모 컴포넌트의 데이터가 자동으로 새로고침되지 않던 문제를 해결했습니다.

-   **관리자 페이지 UI 통일성 강화:**
    -   `AdminProject` 페이지의 테이블 스타일을 `AdminEdit` 페이지의 최신 디자인과 동일하게 맞춰, 관리자 대시보드의 전체적인 디자인 통일성을 향상시켰습니다.

### 3. 백엔드 견고성 강화: 활동 로그 시스템 구축

-   **`project_activity_logs` 테이블 및 트리거 생성:**
    -   모든 프로젝트의 상태 변경 이력을 자동으로 기록하는 활동 로그 시스템을 구축했습니다.
    -   **데이터베이스 트리거**를 사용하여, `projects` 테이블의 `status`가 변경될 때마다 관련 정보(변경자, 변경 전/후 상태, 시간 등)가 `project_activity_logs` 테이블에 자동으로 기록되도록 구현했습니다. 이를 통해 시스템의 모든 변경 사항을 안정적으로 추적할 수 있게 되었습니다.

-   **`AdminLog.jsx` 페이지 구현:**
    -   관리자가 모든 활동 로그를 확인할 수 있는 '활동 로그' 페이지를 구현했습니다.
    -   `get_activity_logs` RPC를 통해 로그 데이터와 관련 프로젝트 이름을 한번에 조회하고, 변경 이력을 한눈에 보기 쉬운 테이블 형태로 제공합니다.

### 4. 고난이도 버그 디버깅 및 해결

-   세션 전반에 걸쳐, 원인을 파악하기 매우 어려운 데이터베이스 버그들을 체계적으로 디버깅하고 해결했습니다.
-   특히, 클라이언트가 올바른 값을 보냈음에도 불구하고 데이터베이스가 완전히 다른 값으로 오류를 보고하는 이례적인 현상을 마주했습니다.
-   `BEFORE UPDATE` 트리거, `RULE`, RPC 함수 오버로딩, 타입 캐스팅, `SECURITY DEFINER` 옵션 누락 등 모든 가능성을 순차적으로 테스트했으며, 최종적으로는 Supabase 시스템의 깊은 곳에서 발생하는 버그(트리거 함수 내의 `description` 문자열을 잘못 파싱하는 문제)임을 밝혀내고, 이를 우회하여 문제를 해결했습니다.

# 기술 문서: Admin 페이지 사용자 이름(센터명) 조회 패턴 (2025-11-07)

## 1. 문제 정의

관리자 대시보드의 여러 페이지(`AdminProject`, `AdminKanban`, `AdminEdit` 등)에서는 Supabase `projects` 테이블의 `user_id`를 기반으로 Clerk에 저장된 실제 사용자 이름(센터명)을 표시해야 합니다.

각 페이지에서 개별적으로 사용자 정보를 호출하고 상태를 관리하는 것은 비효율적이며, 중복 코드를 양산하고 API 호출을 낭비하는 문제가 있습니다.

## 2. 해결 방안: `UserCacheContext` 활용

이 문제를 해결하기 위해 프로젝트 전반에 걸쳐 일관된 사용자 데이터 캐싱 및 조회 패턴을 사용합니다. 핵심은 `UserCacheContext`입니다.

`UserCacheContext`는 한 번 조회한 사용자 정보를 메모리에 캐싱하여, 동일한 사용자에 대한 중복 API 호출을 방지하고 모든 관리자 페이지에서 사용자 데이터를 쉽게 공유할 수 있도록 합니다.

### 핵심 구성 요소

-   **`UserCacheProvider`**: 모든 관리자 페이지(`AdminLayout`)를 감싸는 컨텍스트 제공자입니다. 이 Provider 하위에 있는 모든 컴포넌트는 `useUserCache` 훅을 사용할 수 있습니다.
-   **`useUserCache` Hook**: 다음 두 가지 중요한 요소를 제공하는 커스텀 훅입니다.
    -   `userCache`: 사용자 정보를 저장하는 객체입니다. `{ [userId]: {username, firstName, ...} }` 형태를 가집니다.
    -   `getUserNames(userIds)`: `user_id` 배열을 인자로 받아, 캐시에 없는 사용자 정보를 Clerk API를 통해 조회하고 `userCache`를 업데이트하는 비동기 함수입니다.

## 3. 구현 패턴 (Step-by-Step 가이드)

새로운 관리자 페이지에서 프로젝트와 연관된 센터명을 표시해야 할 경우, 반드시 다음 패턴을 따릅니다.

### 1단계: `useUserCache` 훅 호출

컴포넌트 상단에서 `useUserCache` 훅을 호출하여 `userCache` 객체와 `getUserNames` 함수를 가져옵니다.

```javascript
import { useUserCache } from '../contexts/UserCacheContext';

// ...
const { userCache, getUserNames, isLoading: isUserCacheLoading } = useUserCache();
// ...
```

### 2단계: 데이터 조회 후 `getUserNames` 호출

`useEffect` 또는 `useCallback`을 사용한 데이터 조회 함수 내부에서, Supabase로부터 주 데이터(예: `projects`)를 가져온 **직후**에 `getUserNames`를 호출합니다.

```javascript
const fetchData = useCallback(async () => {
  // 1. Supabase에서 프로젝트 데이터를 가져옵니다.
  const { data: projectsData, error } = await supabase
    .from('projects')
    .select('*');
  if (error) throw error;

  // 2. 가져온 데이터에서 중복을 제거한 user_id 배열을 추출합니다.
  const userIds = [...new Set(projectsData.map(p => p.user_id).filter(Boolean))];

  // 3. user_id가 있을 경우에만 getUserNames를 호출하여 캐시를 채웁니다.
  if (userIds.length > 0) {
    await getUserNames(userIds);
  }

  setProjects(projectsData);
}, [supabase, getUserNames]);
```

### 3단계: JSX에서 `userCache` 사용

데이터를 렌더링할 때, `userCache` 객체를 사용하여 `user_id`에 해당하는 사용자 정보를 조회하고, `username` 속성을 화면에 표시합니다. **객체 전체가 아닌 `.username` 속성을 사용해야 React 렌더링 오류가 발생하지 않습니다.**

**주의:** 데이터가 아직 로드되지 않았을 경우를 대비해, 옵셔널 체이닝(`?.`)과 기본값(`|| '...'`)을 사용하는 것이 안전합니다.

```jsx
<TableBody>
  {projects.map(project => (
    <TableRow key={project.id}>
      <TableCell>
        {userCache[project.user_id]?.username || '...'}
      </TableCell>
      {/* ... other cells */}
    </TableRow>
  ))}
</TableBody>
```

이 패턴을 따르면 모든 관리자 페이지에서 최소한의 API 호출로 사용자 이름을 일관되고 효율적으로 표시할 수 있습니다.

## 사용자 식별 및 정보 관리 시스템 리팩토링 (2025-11-10)

이번 세션에서는 사용자(센터) 정보의 관리 효율성과 UI/UX를 개선하기 위한 중요한 리팩토링 및 기능 추가를 진행했습니다.

### 1. 문제 정의

- **Clerk `username`의 한계:** Clerk의 `username`은 시스템의 고유 ID 역할을 하지만, 한글을 지원하지 않아 UI에 직관적인 센터 이름을 표시하기 어려웠습니다.
- **사용자 정보 수정 기능 부재:** 관리자가 생성된 사용자의 정보(담당자, 연락처 등)를 추후에 수정할 수 있는 기능이 없었습니다.

### 2. 해결 방안 및 구현 내용

#### 2.1. 데이터 모델 확장: `center_name` 컬럼 추가

- **조치:** `user_profiles` 테이블에 UI에 표시될 실제 센터 이름(한글 지원)을 저장하기 위한 `center_name` (TEXT 타입) 컬럼을 새로 추가했습니다.
- **기대 효과:** 시스템 ID(`username`)와 UI 표시용 이름(`center_name`)을 명확하게 분리하여 데이터 모델을 개선했습니다.

#### 2.2. 사용자 생성 플로우 개선

- **`AddUserForm.jsx` 수정:**
  - 기존의 "센터명" 필드를 "센터 ID (영문/숫자)"로 명확히 하고, `username`을 받도록 했습니다.
  - "센터 이름 (한글)"을 입력받는 새로운 필드를 추가하여 `center_name`을 받도록 했습니다.
- **`create-clerk-user` Edge Function 수정:**
  - 프론트엔드에서 `centerName` 데이터를 추가로 받아, `user_profiles` 테이블에 저장하도록 백엔드 로직을 업데이트했습니다.

#### 2.3. 전역 UI 업데이트: `center_name` 표시

- **`AdminProject.jsx`:** 프로젝트 목록 테이블의 '센터명' 컬럼에 `center_name`과 `username`을 함께 표시하도록 수정했습니다.
- **`AdminKanban.jsx` & `TaskCard.jsx`:** 칸반 보드의 각 카드에 `center_name`과 `username`이 모두 표시되도록 UI를 개선했습니다.
- **`AdminUsers.jsx`:** 사용자 목록 페이지에 `center_name`, `username`, `member_name`을 명확히 구분하여 표시하도록 수정했습니다.

#### 2.4. 신규 기능: 사용자 정보 수정 모달

- **`UserInfoModal.jsx` 생성:** 사용자의 `center_name`, `member_name`, `phone_number`를 수정할 수 있는 재사용 가능한 모달 컴포넌트를 새로 구현했습니다.
- **`AdminUsers.jsx` 연동:**
  - 각 사용자 항목에 '수정' 버튼을 추가했습니다.
  - 버튼 클릭 시 `UserInfoModal`을 열고, 저장이 완료되면 콜백 함수를 통해 사용자 목록을 자동으로 새로고침하여 변경사항이 즉시 반영되도록 구현했습니다.

### 3. 결과

- 이제 시스템 전반에서 직관적인 한글 센터명을 사용할 수 있게 되어 **사용자 경험이 크게 향상**되었습니다.
- 관리자는 이제 사용자 목록 페이지에서 직접 **사용자 정보를 생성하고 수정**할 수 있는 완전한 관리 기능을 갖추게 되었습니다.
