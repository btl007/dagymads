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

1 ---
    2
    3 ## 최근 UI/UX 리팩토링 로그 (2025년 9월 19일)
    4
    5 이 로그는 최근 UI/UX 리팩토링 노력을 요약하며, 애플리케이션
      전반의 사용자 경험 및 일관성 향상에 중점을 둡니다.
    6
    7 ### 1. AdminLayout.jsx 리팩토링
    8
    9 -   **목표:** 메인 관리자 레이아웃, 특히 사이드바 및
      상호작용 개선.
   10 -   **변경 사항:**
   11     -   `ResizablePanelGroup` 및 관련 컴포넌트를 제거하고,
      더 간단한 Flexbox 기반 레이아웃을 채택했습니다.
   12     -   사이드바의 너비와 메인 콘텐츠의 여백을 제어하기
      위해 `SidebarProvider`의 `open` 상태를 통합하여 Notion과
      같은 축소(아이콘만 있는 얇은 바)를 가능하게 했습니다.
   13     -   사이드바의 확장/축소 상태를 제어하는
      `SidebarTrigger` (토글 버튼)를 추가했습니다.
   14     -   메인 콘텐츠 영역에 `SidebarTrigger`, 정적 페이지
      제목("Admin Dashboard"), Clerk `UserButton`을 포함하는 기본
      툴바를 추가했습니다.
   15 -   **해결:** 기능적인 축소 사이드바를 통해 더욱 간소화되고
      일관된 관리자 레이아웃을 구현했습니다.
   16
   17 ### 2. Header.jsx 리팩토링 (되돌림)
   18
   19 -   **목표:** 초기에는 전역 `Header.jsx` 스타일을 SaaS
      애플리케이션에 더 적합하도록 간소화하려고 시도했습니다.
   20 -   **변경 사항:**
   21     -   `backdrop-blur` 및 플로팅 스타일을 제거하고
      표준적인 전체 너비 고정 헤더로 대체하려고 시도했습니다.
   22 -   **되돌림:** 사용자 피드백에 따라 `Header.jsx`에 대한
      모든 변경 사항을 되돌려 원래 상태로 복원했습니다.
   23
   24 ### 3. main.jsx 및 App.jsx (되돌림)
   25
   26 -   **목표:** 초기에는 `BrowserRouter`를 `main.jsx`로
      이동하고, 라우트에 따라 `App.jsx`에서 `Header`를 조건부로
      렌더링하려고 시도했습니다.
   27 -   **발생한 문제:**
   28     -   `Router` 중첩 문제로 인한 `App.jsx`의
      `useLocation()` 오류.
   29     -   `BrowserRouter`가 "데이터 라우터"가 아니어서
      `AdminLayout.jsx`의 `useMatches()` 오류.
   30 -   **되돌림:** 라우팅 관련 오류를 해결하고 디버깅
      프로세스를 단순화하기 위해 `main.jsx` 및 `App.jsx`에 대한
      모든 변경 사항을 되돌려 원래 상태로 복원했습니다.
   31
   32 ### 4. AdminKanban.jsx 리팩토링
   33
   34 -   **목표:** 칸반 보드의 시각적 명확성 및 사용자 경험
      개선.
   35 -   **변경 사항:**
   36     -   **컬럼 스타일링 (`ColumnContainer.jsx`):**
      `shadcn/ui` `Card` 컴포넌트를 사용하도록 리팩토링했습니다.
      `TaskCard`와의 시각적 구분을 위해 배경을 `bg-card`에서
      `bg-muted`로 변경했습니다.
   37     -   **태스크 카드 스타일링 (`TaskCard.jsx`):**
      `shadcn/ui` `Card` 컴포넌트 및 테마를 고려한 색상을
      사용하도록 리팩토링했습니다. `ColumnContainer`의 태스크
      개수 배지는 일관성을 위해 `TaskCard`의 배경(`bg-card`)과
      일치하도록 업데이트되었습니다.
   38     -   **프로젝트 정보 모달 통합:**
   39         -   각 `TaskCard`에 상세 모달을 여는 "편집"
      버튼(PencilIcon)을 추가했습니다.
   40         -   모달을 제어하기 위해 `AdminKanban.jsx`에 상태
      관리(`isModalOpen`, `selectedProject`)를 구현했습니다.
   41         -   `AdminKanban.jsx`에서 `shadcn/ui` `Dialog` 및
      `DialogContent` 내부에 `ProjectInfoModal`을 통합했습니다.
   42         -   모달 데이터 및 업데이트를 관리하기 위해
      `handleViewDetails` 및 `handleProjectSave` 함수를
      구현했습니다.
   43         -   모달 내 접근성을 위해 `DialogHeader`,
      `DialogTitle`, `DialogDescription`을 추가했습니다.
   44 -   **해결:** 칸반 보드의 시각적 매력과 상호작용성을 크게
      향상시켜 사용자가 태스크 카드에서 직접 프로젝트 세부 정보를
      보고 편집할 수 있도록 했습니다.
   45
   46 ### 5. ProjectInfoModal.jsx 리팩토링
   47
   48 -   **목표:** `ProjectInfoModal.jsx`를 내부 `Dialog` 래퍼를
      제거하여 재사용 가능한 콘텐츠 전용 컴포넌트로 리팩토링.
   49 -   **변경 사항:**
   50     -   `Dialog` 및 `DialogContent` 임포트를 제거했습니다.
   51     -   컴포넌트 프롭에서 `isOpen` 및 `onClose`를
      제거했습니다.
   52     -   컴포넌트의 `return` 문을 모달의 콘텐츠를 직접
      반환하도록 수정했습니다 (React Fragment `<>...</>`로 래핑).
   53     -   모달 닫기가 이제 부모에서 처리되므로 `handleSave`
      에서 `onClose()` 호출 및 "취소" 버튼에서
      `onClick={onClose}`를 제거했습니다.
   54     -   `export default` 문 및 후행 세미콜론과 관련된 구문
      오류를 수정했습니다.
   55 -   **해결:** `ProjectInfoModal`은 이제 "dumb" 컴포넌트가
      되어 재사용성이 높아졌으며 `AdminKanban.jsx` 및
      `AdminProject.jsx`에 올바르게 통합되었습니다.
   56
   57 ### 6. AdminProject.jsx 리팩토링
   58
   59 -   **목표:** 리팩토링된 `ProjectInfoModal`을
      `AdminProject` 페이지에 올바르게 통합.
   60 -   **변경 사항:**
   61     -   `Dialog`, `DialogContent`, `DialogHeader`,
      `DialogTitle`, `DialogDescription` 임포트를 추가했습니다.
   62     -   `AdminProject.jsx`에서 `ProjectInfoModal`을
      `Dialog` 및 `DialogContent`로 래핑하고 `open={isModalOpen}`
      및 `onOpenChange={setIsModalOpen}`을 전달했습니다.
   63     -   모달에서 프로젝트 업데이트를 처리하기 위해
      `handleProjectSave` 함수를 구현했습니다.
   64     -   `project`, `onClose`, `onSave`, `userName` 프롭이
      `ProjectInfoModal`에 올바르게 전달되도록 했습니다.
   65 -   **해결:** `AdminProject`는 이제 오류 없이
      `ProjectInfoModal`을 올바르게 열고 표시하며
      `AdminKanban.jsx`와의 일관성을 유지합니다.
   66
   67 ### 7. AdminVideo.jsx 리팩토링
   68
   69 -   **목표:** 오른쪽 패널이 월별 보기를 기반으로 프로젝트
      데이터를 표시하도록 리팩토링.
   70 -   **변경 사항:**
   71     -   `projectsOnSelectedDate` 대신
      `projectsInSelectedMonth`를 표시하도록 필터링 로직을
      수정했습니다.
   72     -   오른쪽 패널의 `CardTitle`을 선택된 월을 반영하도록
      업데이트했습니다 (예: "YYYY년 MM월 촬영 정보").
   73     -   누락된 `useMemo` 임포트를 수정했습니다.
   74 -   **해결:** `AdminVideo` 페이지는 이제 프로젝트의 월별
      개요를 제공하여 유용성을 향상시켰습니다.