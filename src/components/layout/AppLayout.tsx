"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Book, Shield, User, LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  view: string;
  setView: (view: string) => void;
}

export const AppLayout = ({ children, view, setView }: LayoutProps) => {
  const { user, logout, isEmployee, isManager, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    ...(isEmployee || isManager ? [
      { id: 'dashboard', label: 'My Dashboard', icon: Book },
      { id: 'catalog', label: 'Course Catalog', icon: Book }
    ] : []),
    ...(isManager ? [
      { id: 'team', label: 'Team Approvals', icon: User }
    ] : []),
    ...(isAdmin ? [
      { id: 'admin', label: 'Admin Portal', icon: Shield }
    ] : [])
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out sidebar-transition
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              Training Manager
            </h1>
            <p className="text-xs text-slate-400 mt-1">Enterprise Edition</p>
          </div>
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-4 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  view === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={18} className={view === item.id ? 'text-blue-200' : 'text-slate-400'} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0) || user?.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.name || user?.email}</div>
                <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-700">
              <Menu size={24} />
            </button>
            <h1 className="font-semibold text-slate-800">Training Manager</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
