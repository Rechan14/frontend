import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  employmentType: string;
  absentDates: string[];
}

interface Attendance {
  id: number;
  userId: number;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
}

const AbsentTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [date, setDate] = useState(dayjs().subtract(1, 'day').format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user: authUser, token } = useAuth();
  const [retryCount, setRetryCount] = useState(0);

  const fetchAbsentData = async () => {
    if (!token) {
      setError("Please log in to view absent records");
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log("Starting to fetch absents for date:", date);
      
      // Fetch both users and attendance records with authentication
      const [usersResponse, attendanceResponse] = await Promise.all([
        axios.get('http://localhost:4000/accounts', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        axios.get('http://localhost:4000/attendances', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      const allUsers: User[] = usersResponse.data;
      const attendances: Attendance[] = attendanceResponse.data;

      // Process each user to find their absent dates
      const usersWithAbsences = allUsers.map(user => {
        // Get dates when user was present
        const presentDates = new Set(
          attendances
            .filter(attendance => 
              attendance.userId === user.id && 
              attendance.timeIn &&
              attendance.date === date // Only check for selected date
            )
            .map(attendance => new Date(attendance.date).toISOString().split('T')[0])
        );

        // If user has no attendance record for the selected date, they are absent
        const isAbsent = !presentDates.has(date);

        return {
          ...user,
          absentDates: isAbsent ? [date] : []
        };
      });

      // Filter to only show users who are absent on the selected date
      const usersWithAbsencesOnly = usersWithAbsences.filter(user => user.absentDates.length > 0);

      console.log("Users with absences:", usersWithAbsencesOnly);
      setUsers(usersWithAbsencesOnly);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error("Error fetching absents:", err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else if (err.response?.status === 404) {
        setError("No data found for the selected date.");
      } else if (retryCount < 3) {
        // Retry up to 3 times
        setRetryCount(prev => prev + 1);
        setTimeout(fetchAbsentData, 2000); // Retry after 2 seconds
      } else {
        setError(`Failed to fetch absent records: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAbsentData();
    }
  }, [date, token]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageBreadcrumb pageTitle="Home / Hours / Absent Table" />
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Absent Employees</h2>
            <div className="mt-4 sm:mt-0">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-300 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
              {retryCount > 0 && (
                <p className="mt-2 text-sm">Retrying... ({retryCount}/3)</p>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 py-8">
              <span className="text-5xl">🎉</span>
              <p className="mt-2">No absences found for {dayjs(date).format("MMM D, YYYY")}!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">Full Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">Employment Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                        {`${user.firstName} ${user.lastName}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                        {user.employmentType}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                          {dayjs(date).format("MMM D, YYYY")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AbsentTable;