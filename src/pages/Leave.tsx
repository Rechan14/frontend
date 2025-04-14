import React, { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import LeaveModal from "../pages/LeaveModal";

// Interfaces for the props and data
interface LeaveType {
  action: string;
  type: string;
  units: string;
  nextAccrual: string;
  schedule: string;
  earned: string;
  approved: string;
  availableBalance: string;
  pendingApproval: string;
}

interface LeaveHistory {
  action: string;
  type: string;
  dateFiled: string;
  period: string;
  requested: string;
  previousBalance: string;
  shift: string;
  status: string;
  paid: string;
  reason: string;
}

interface LeaveProps {
  leaveTypes: LeaveType[] | undefined;
  leaveHistory: LeaveHistory[] | undefined;
}

const Leave: React.FC<LeaveProps> = ({ leaveTypes = [], leaveHistory = [] }) => {
  const [leaveTypesPage, setLeaveTypesPage] = useState(1);
  const [leaveHistoryPage, setLeaveHistoryPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const leaveTypesPerPage = 5;
  const leaveHistoryPerPage = 5;

  const totalLeaveTypesPages = Math.ceil(leaveTypes.length / leaveTypesPerPage);
  const totalLeaveHistoryPages = Math.ceil(leaveHistory.length / leaveHistoryPerPage);

  const currentLeaveTypes = leaveTypes.slice(
    (leaveTypesPage - 1) * leaveTypesPerPage,
    leaveTypesPage * leaveTypesPerPage
  );

  const currentLeaveHistory = leaveHistory.slice(
    (leaveHistoryPage - 1) * leaveHistoryPerPage,
    leaveHistoryPage * leaveHistoryPerPage
  );

  return (
    <>
    <PageBreadcrumb pageTitle="Home / Hours / Leave History" />
      <div className="p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200">
        <div className="p-6 space-y-8">
          {/* Leave Types Table */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Leave Types
              </h3>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                onClick={() => setIsModalOpen(true)} // Open the modal when clicked
              >
                Add Leave
              </button>
            </div>

            <div className="overflow-x-auto shadow-sm rounded-lg">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">Action</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Units</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Next Accrual</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Schedule</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Earned</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Approved</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Available Balance</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Pending Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentLeaveTypes.map((leave, index) => (
                    <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                      <td className="px-6 py-3 text-sm">{leave.action}</td>
                      <td className="px-6 py-3 text-sm">{leave.type}</td>
                      <td className="px-6 py-3 text-sm">{leave.units}</td>
                      <td className="px-6 py-3 text-sm">{leave.nextAccrual}</td>
                      <td className="px-6 py-3 text-sm">{leave.schedule}</td>
                      <td className="px-6 py-3 text-sm">{leave.earned}</td>
                      <td className="px-6 py-3 text-sm">{leave.approved}</td>
                      <td className="px-6 py-3 text-sm">{leave.availableBalance}</td>
                      <td className="px-6 py-3 text-sm">{leave.pendingApproval}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setLeaveTypesPage(Math.max(1, leaveTypesPage - 1))}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                disabled={leaveTypesPage === 1}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {leaveTypesPage} / {totalLeaveTypesPages}
              </span>
              <button
                onClick={() => setLeaveTypesPage(Math.min(totalLeaveTypesPages, leaveTypesPage + 1))}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                disabled={leaveTypesPage === totalLeaveTypesPages}
              >
                Next
              </button>
            </div>
          </section>

          {/* Leave History Table */}
          <section>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Leave History</h3>
            <div className="overflow-x-auto shadow-sm rounded-lg">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">Action</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Date Filed</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Period</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Requested</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Previous Balance</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Shift</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Paid</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentLeaveHistory.map((history, index) => (
                    <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                      <td className="px-6 py-3 text-sm">{history.action}</td>
                      <td className="px-6 py-3 text-sm">{history.type}</td>
                      <td className="px-6 py-3 text-sm">{history.dateFiled}</td>
                      <td className="px-6 py-3 text-sm">{history.period}</td>
                      <td className="px-6 py-3 text-sm">{history.requested}</td>
                      <td className="px-6 py-3 text-sm">{history.previousBalance}</td>
                      <td className="px-6 py-3 text-sm">{history.shift}</td>
                      <td className="px-6 py-3 text-sm">{history.status}</td>
                      <td className="px-6 py-3 text-sm">{history.paid}</td>
                      <td className="px-6 py-3 text-sm">{history.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setLeaveHistoryPage(Math.max(1, leaveHistoryPage - 1))}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                disabled={leaveHistoryPage === 1}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {leaveHistoryPage} / {totalLeaveHistoryPages}
              </span>
              <button
                onClick={() => setLeaveHistoryPage(Math.min(totalLeaveHistoryPages, leaveHistoryPage + 1))}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                disabled={leaveHistoryPage === totalLeaveHistoryPages}
              >
                Next
              </button>
            </div>
          </section>
        </div>
      </div>
        {/* Modal Component */}
        <LeaveModal isOpen={isModalOpen} closeModal={() => setIsModalOpen(false)} />
    </>
  );
};

export default Leave;