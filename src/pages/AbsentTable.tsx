import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

interface AbsentUser {
  fullName: string;
  date: string;
  remarks: string;
}

const AbsentTable: React.FC = () => {
  const [absents, setAbsents] = useState<AbsentUser[]>([]);
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);

  const fetchAbsents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/attendances/absents/by-date?date=${date}`);
      setAbsents(response.data);
    } catch (error) {
      console.error("Failed to fetch absents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsents();
  }, [date]);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
      <h2 className="text-2xl font-semibold text-gray-800">Absent Users</h2>
      <div className="mt-4 sm:mt-0">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  
    {loading ? (
      <p className="text-gray-500 italic">Loading...</p>
    ) : absents.length === 0 ? (
      <div className="flex flex-col items-center justify-center text-gray-500 py-8">
        <span className="text-5xl">🎉</span>
        <p className="mt-2">Absent pd panagsa my guy</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Full Name</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {absents.map((user, index) => (
              <tr
                key={index}
                className="border-t border-gray-200 hover:bg-gray-50 transition-all"
              >
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{user.fullName}</td>
                <td className="p-3">{dayjs(user.date).format("MMM D, YYYY")}</td>
                <td className="p-3">{user.remarks || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>  
  );
};

export default AbsentTable;