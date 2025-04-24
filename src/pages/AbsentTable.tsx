import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  employmentType: string;
}

interface Attendance {
  id: number;
  userId: number;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
}

interface AbsenceRecord {
  userId: number;
  firstName: string;
  lastName: string;
  employmentType: string;
  date: string;
}

interface ApiError {
  message: string;
  status?: number;
}

const AbsentTable: React.FC = () => {
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const { user: authUser, token } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [filter, setFilter] = useState<string>('');

  const fetchData = async () => {
    if (!token) {
      setError({ message: "Please log in to view absent records" });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [usersResponse, attendanceResponse] = await Promise.all([
        axios.get('http://localhost:4000/accounts', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:4000/attendances', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const users: User[] = usersResponse.data;
      const attendances: Attendance[] = attendanceResponse.data;

      // Get all dates from attendance records
      const allDates = [...new Set(attendances.map(a => a.date))].sort();

      // Create absence records
      const absenceRecords: AbsenceRecord[] = [];
      
      users.forEach(user => {
        allDates.forEach(date => {
          const hasAttendance = attendances.some(
            a => a.userId === user.id && 
            a.date === date && 
            a.timeIn
          );

          if (!hasAttendance) {
            absenceRecords.push({
              userId: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              employmentType: user.employmentType,
              date: date
            });
          }
        });
      });

      // Sort by date (most recent first)
      absenceRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setAbsences(absenceRecords);
      setRetryCount(0);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      
      if (err.response?.status === 401) {
        setError({ message: "Session expired. Please log in again.", status: 401 });
      } else if (err.response?.status === 404) {
        setError({ message: "No data found.", status: 404 });
      } else if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(fetchData, 2000);
      } else {
        setError({ message: `Failed to fetch records: ${err.message}` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchData();
  };

  const filteredAbsences = React.useMemo(() => {
    if (!filter) return absences;
    
    return absences.filter(absence => 
      absence.firstName.toLowerCase().includes(filter.toLowerCase()) ||
      absence.lastName.toLowerCase().includes(filter.toLowerCase()) ||
      absence.employmentType.toLowerCase().includes(filter.toLowerCase()) ||
      dayjs(absence.date).format('MMM D, YYYY').toLowerCase().includes(filter.toLowerCase())
    );
  }, [absences, filter]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageBreadcrumb pageTitle="Home / Hours / Absent Table" />
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Absence Records</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by name, type, or date..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-300 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              <div className="flex justify-between items-center">
                <p>{error.message}</p>
                {retryCount > 0 && (
                  <button
                    onClick={handleRetry}
                    className="ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Retry ({retryCount}/3)
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAbsences.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 py-8">
              <span className="text-5xl">🎉</span>
              <p className="mt-2">No absence records found!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                      Employment Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                      Date of Absence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAbsences.map((absence) => (
                    <tr
                      key={`${absence.userId}-${absence.date}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                        {`${absence.firstName} ${absence.lastName}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                        {absence.employmentType}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                          {dayjs(absence.date).format("MMM D, YYYY")}
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