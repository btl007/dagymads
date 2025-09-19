import React from 'react';
import { Outlet } from 'react-router-dom'; // Removed useLocation, useMatches
import { UserButton } from '@clerk/clerk-react'; // Import UserButton

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Toaster } from "sonner";
import { cn } from '@/lib/utils';

const AdminLayoutContent = () => {
  const { open, toggleSidebar } = useSidebar();

  // Define sidebar width based on open state
  const sidebarWidth = open ? 'w-[var(--sidebar-width)]' : 'w-[var(--sidebar-width-icon)]';
  const mainContentMargin = open ? 'ml-[var(--sidebar-width)]' : 'ml-[var(--sidebar-width-icon)]';

  // Static page title for now, as dynamic title requires data router
  const pageTitle = 'Admin Dashboard';


  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-10 hidden h-svh transition-[width] duration-200 ease-linear md:flex flex-col",
          sidebarWidth,
          "bg-sidebar text-sidebar-foreground"
        )}
      >
        <AppSidebar collapsible="icon" />
      </div>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 overflow-y-auto transition-[margin-left] duration-200 ease-linear",
          mainContentMargin
        )}
      >
        {/* Admin Toolbar */}
        <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger onClick={toggleSidebar} />
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* User Button from Clerk */}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        
        <div className="p-4"> {/* Add padding to the content below the toolbar */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const AdminLayout = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <Toaster richColors theme="dark" />
      <AdminLayoutContent />
    </SidebarProvider>
  );
};

export default AdminLayout;
