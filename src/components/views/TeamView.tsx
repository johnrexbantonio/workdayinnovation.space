"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Enrollment, Allocation } from '@/lib/types';
import { getTeamEnrollments, updateEnrollmentStatus, getGlobalCredits } from '@/lib/data/firebase-client';
import { CheckCircle, XCircle, Mail, Clock } from 'lucide-react';

export const TeamView = () => {
  const [requests, setRequests] = useState<Enrollment[]>([]);
  const [pool, setPool] = useState<Allocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [reqs, globalPool] = await Promise.all([
      getTeamEnrollments(),
      getGlobalCredits()
    ]);
    // Sort so pending is top
    setRequests(reqs.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return 0;
    }));
    setPool(globalPool);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (req: Enrollment) => {
    if (!pool) return;

    // Check if enough credits
    if (pool.totalCredits - pool.usedCredits < req.credits) {
      alert("Not enough credits in the global pool.");
      return;
    }

    await updateEnrollmentStatus(req.id, 'approved', req.credits);
    loadData(); // reload
  };

  const handleReject = async (reqId: string) => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason");
      return;
    }
    await updateEnrollmentStatus(reqId, 'rejected', 0, rejectReason);
    setRejectingId(null);
    setRejectReason('');
    loadData();
  };

  const generateMailto = (req: Enrollment) => {
    const subject = encodeURIComponent(`Training Enrollment Request: ${req.courseName}`);
    const body = encodeURIComponent(
      `Hello LMS Team,\n\nPlease enroll the following employee in the specified course:\n\n` +
      `Employee Email: ${req.employeeEmail}\n` +
      `Course: ${req.courseName}\n` +
      `Course ID: ${req.courseId}\n` +
      `Approval Date: ${new Date().toLocaleDateString()}\n\n` +
      `Thank you.`
    );
    return `mailto:lms-admin@ibm.com?subject=${subject}&body=${body}`;
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const availableCredits = pool ? pool.totalCredits - pool.usedCredits : 0;
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const otherRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Team Approvals</h2>
          <p className="text-slate-500 text-sm mt-1">Manage training requests from your team.</p>
        </div>

        <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <CheckCircle className="text-blue-600" size={20} />
          </div>
          <div>
            <div className="text-sm text-slate-500">Shared Credits Available</div>
            <div className="text-xl font-bold text-slate-900">
              {availableCredits} / {pool?.totalCredits}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Pending Requests ({pendingRequests.length})</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No pending requests.</div>
          ) : (
            pendingRequests.map(req => (
              <div key={req.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-slate-900">{req.employeeEmail}</span>
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-md flex items-center gap-1">
                      <Clock size={12} /> Pending
                    </span>
                  </div>
                  <h4 className="text-slate-800">{req.courseName}</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Requested: {new Date(req.requestDate).toLocaleDateString()} • Cost: {req.credits} Units
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {rejectingId === req.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reason for rejection"
                        className="px-3 py-2 border rounded-lg text-sm"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                      <button
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApprove(req)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button
                        onClick={() => setRejectingId(req.id)}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-red-600 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Processed Requests</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {otherRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No processed requests yet.</div>
          ) : (
            otherRequests.map(req => (
              <div key={req.id} className="p-6 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-slate-900">{req.employeeEmail}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-md capitalize ${
                      req.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <h4 className="text-slate-600 text-sm">{req.courseName}</h4>
                  {req.rejectionReason && (
                    <p className="text-xs text-red-500 mt-1">Reason: {req.rejectionReason}</p>
                  )}
                </div>
                {req.status === 'approved' && (
                  <div className="flex items-center">
                    <a
                      href={generateMailto(req)}
                      className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <Mail size={16} /> Send to LMS
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
