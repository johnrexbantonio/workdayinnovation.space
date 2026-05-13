"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Enrollment } from '@/lib/types';
import { getUserEnrollments } from '@/lib/data/firebase-client';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const DashboardView = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEnrollments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getUserEnrollments(user.email);
    setEnrollments(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected': return <XCircle className="text-red-500" size={20} />;
      case 'enrolled': return <CheckCircle className="text-blue-500" size={20} />;
      default: return <Clock className="text-amber-500" size={20} />;
    }
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'enrolled': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome, {user?.name || user?.email.split('@')[0]}</h2>
        <p className="text-slate-500 text-sm mt-1">Here is a summary of your training requests.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">My Requests</h3>
        </div>

        {enrollments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p>You haven&apos;t requested any training yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {enrollments.map((req) => (
              <div key={req.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900">{req.courseName}</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Requested on {new Date(req.requestDate).toLocaleDateString()}
                  </p>
                  {req.rejectionReason && (
                    <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded-md border border-red-100 inline-block">
                      Reason: {req.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-slate-600">{req.credits} Units</span>
                    <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${getStatusClass(req.status)}`}>
                      {getStatusIcon(req.status)}
                      <span className="capitalize">{req.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
