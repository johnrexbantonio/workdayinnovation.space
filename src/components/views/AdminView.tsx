"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Allocation } from '@/lib/types';
import { User } from '@/contexts/AuthContext';
import { getAllUsers, updateUserRole, uploadCoursesCsv, getGlobalCredits, updateGlobalCredits } from '@/lib/data/firebase-client';
import { Shield, Upload, Database, Users } from 'lucide-react';

export const AdminView = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pool, setPool] = useState<Allocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);
  const [newCredits, setNewCredits] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [fetchedUsers, fetchedPool] = await Promise.all([
      getAllUsers(),
      getGlobalCredits()
    ]);
    setUsers(fetchedUsers);
    setPool(fetchedPool);
    setNewCredits(fetchedPool.totalCredits.toString());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleChange = async (email: string, role: string) => {
    await updateUserRole(email, role);
    setMessage({ text: `Updated ${email} to ${role}`, type: 'success' });
    loadData();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await uploadCoursesCsv(content);
      setUploading(false);
      if (success) {
        setMessage({ text: 'Catalog uploaded successfully', type: 'success' });
      } else {
        setMessage({ text: 'Failed to upload catalog', type: 'error' });
      }
      setTimeout(() => setMessage(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  const handleUpdateCredits = async () => {
    const val = parseInt(newCredits);
    if (isNaN(val)) return;
    await updateGlobalCredits(val);
    setMessage({ text: 'Global credits updated', type: 'success' });
    loadData();
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) return <div className="p-8 text-center">Loading Admin Portal...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="text-indigo-600" /> Admin Portal
        </h2>
        <p className="text-slate-500 text-sm mt-1">Manage system configurations, users, and global credits.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Credits Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <Database className="text-indigo-600" size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">Global Credit Pool</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
              <span className="text-slate-600 font-medium">Used Credits</span>
              <span className="text-xl font-bold text-slate-900">{pool?.usedCredits}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Credits Capacity</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newCredits}
                  onChange={e => setNewCredits(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={handleUpdateCredits}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Management */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Upload className="text-blue-600" size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">Catalog Management</h3>
          </div>
          <div className="mt-4 p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors relative cursor-pointer">
            <Upload className="text-slate-400 mb-2" size={24} />
            <p className="text-sm font-medium text-slate-700">Upload new CSV Catalog</p>
            <p className="text-xs text-slate-500 mt-1">Replaces current entries matching IDs, adds new ones.</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
          </div>
          {uploading && <p className="text-sm text-blue-600 mt-2 text-center">Uploading...</p>}
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Users className="text-slate-600" size={20} />
          <h3 className="font-semibold text-slate-800">User Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-sm border-b border-slate-200">
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{u.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-md capitalize ${
                      u.role === 'admin' ? 'bg-indigo-50 text-indigo-700' :
                      u.role === 'manager' ? 'bg-purple-50 text-purple-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.email, e.target.value)}
                      className="border rounded-lg px-2 py-1 bg-white"
                      disabled={u.email === 'john.rex.antonio@ibm.com'} // Prevent demoting main admin easily
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
