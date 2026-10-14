import React from 'react';
import { storage } from '../../services/storage';

export const AdminAuditLogs: React.FC = () => {
  const logs = storage.getAuditLogs();

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold font-display text-stone-900">
          Security & Operations Audit Trail
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Immutable historical log of configuration changes, pricing adjustments, and administrative events
        </p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No audit records logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Actor Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Target Resource</th>
                  <th className="px-6 py-3">Old Value</th>
                  <th className="px-6 py-3">New Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/70">
                    <td className="px-6 py-3 text-stone-500 font-sans whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-semibold text-stone-900">
                      {log.actorEmail}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-[10px] font-bold uppercase bg-stone-100 px-2 py-0.5 rounded text-stone-700 font-sans">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-bold text-amber-900">
                      {log.action}
                    </td>
                    <td className="px-6 py-3 text-stone-600">
                      {log.targetResource}
                    </td>
                    <td className="px-6 py-3 text-stone-400">
                      {log.previousValue || '—'}
                    </td>
                    <td className="px-6 py-3 text-green-700 font-medium">
                      {log.newValue || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
