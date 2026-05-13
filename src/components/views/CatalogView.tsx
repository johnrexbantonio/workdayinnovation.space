"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Course } from '@/lib/types';
import { getCourses, requestTraining } from '@/lib/data/firebase-client';
import { Search, Book, Clock } from 'lucide-react';

export const CatalogView = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    const data = await getCourses();
    setCourses(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleRequest = async (course: Course) => {
    if (!user) return;

    // In this MVP, we don't have a rigid manager assignment, so we'll just put 'manager@ibm.com'
    // or leave it blank to indicate it goes to the shared manager pool.
    const managerEmail = 'shared-managers@ibm.com';

    const success = await requestTraining(user.email, managerEmail, course);
    if (success) {
      setMessage({ text: `Successfully requested ${course.Offering}`, type: 'success' });
    } else {
      setMessage({ text: `Failed to request ${course.Offering}`, type: 'error' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  const filteredCourses = courses.filter(c =>
    c.Offering?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c["Product Area"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c["Program Name"]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Course Catalog</h2>
          <p className="text-slate-500 text-sm mt-1">Browse and request available training programs.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
          <Book className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No courses found</h3>
          <p className="text-slate-500">Try adjusting your search or contact an admin to upload the catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div key={course.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full mb-3">
                  {course["Product Area"]}
                </span>
                <h3 className="font-bold text-slate-900 line-clamp-2">{course.Offering}</h3>
                <p className="text-sm text-slate-500 mt-1">{course["Program Name"]}</p>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-1 rounded-md">
                    <Clock size={14} />
                    {course["Training Units"] || 0} Units
                  </span>
                  {course["Required"] === 'Yes' && (
                    <span className="text-amber-600 font-medium">Required</span>
                  )}
                </div>
                <button
                  onClick={() => handleRequest(course)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Request
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
