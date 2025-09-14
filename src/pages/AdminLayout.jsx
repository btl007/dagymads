import React, { useState } from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet

// Shadcn UI Components for Layout
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { Toaster } from "sonner";

const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <SidebarProvider>
      <Toaster richColors theme="dark" />
      <ResizablePanelGroup
        direction="horizontal"
        className="w-full h-screen items-stretch"
      >
        {/* Sidebar Panel */}
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={25}
          collapsible={true}
          collapsedSize={4}
          onCollapse={() => setIsSidebarCollapsed(true)}
          onExpand={() => setIsSidebarCollapsed(false)}
          className="hidden md:block"
        >
          <AppSidebar isCollapsed={isSidebarCollapsed} />
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden md:flex" />

        {/* Main Content Panel */}
        <ResizablePanel defaultSize={80}>
          <div className="overflow-y-auto h-full">
            {/* Child routes will be rendered here */}
            <Outlet />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </SidebarProvider>
  );
};

export default AdminLayout;
