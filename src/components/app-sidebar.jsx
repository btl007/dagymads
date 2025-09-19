import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { KanbanSquare, Users, Settings, ListChecks, ChartNoAxesGantt,
          LayoutDashboard, List, SquarePlus, LayoutList, BookType,
          Video, } from "lucide-react"; // 예시 아이콘

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import logo from '@/img/wsk_logo_white.png'; // 로고 이미지

// 계층 구조를 가진 메뉴 데이터
const sidebarNav = [
  {
    group: "대시보드",
    items: [
      {
        href: "/admin",
        label: "오버뷰",
        icon: ChartNoAxesGantt,
      },
      {
        href: "/admin/kanban",
        label: "칸반보드",
        icon: KanbanSquare,
      },
    ],
  },
  {
    group: "프로젝트 관리",
    items: [
      {
        href: "/admin/project",
        label: "프로젝트 목록",
        icon: LayoutList,
      },
      {
        href: "/admin/createproject",
        label: "프로젝트 생성",
        icon: SquarePlus,
      },
      {
        href: "/admin/script",
        label: "대본 관리",
        icon: BookType,
      },
      {
        href: "/admin/video",
        label: "촬영 관리",
        icon: Video,
      },
    ]
  },
  {
    group: "센터",
    items: [
      {
        href: "/admin/users",
        label: "센터 목록",
        icon: List,
      },
      {
        href: "/admin/createusers",
        label: "센터 계정 생성",
        icon: Users,
      },
    ],
  },
  {
    group: "기타",
    items: [
      {
        href: "/admin/settings",
        label: "설정",
        icon: Settings,
      },
    ],
  },
];


export function AppSidebar({ className, ...props }) {
  const location = useLocation(); // 현재 경로를 가져오기 위함

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* 로고 */}
        <div className="p-2 font-bold text-lg text-white flex items-center justify-center">
            <img src={logo} alt="Logo" className="w-[120px]" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sidebarNav.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.href}
                    >
                      <Link to={item.href}>
                        <item.icon className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

