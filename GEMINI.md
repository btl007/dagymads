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