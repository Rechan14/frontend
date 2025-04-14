import React, { useEffect, useState } from "react";
import axios from "axios";

type Absent = {
  date: string;
  fullName: string;
  remarks?: string;
};

const Absent: React.FC = () => {
  const [data, setData] = useState<Absent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAbsent = async () => {
      try {
        const res = await axios.get("/api/absent");
        setData(res.data);
      } catch (err: any) {
        console.error("Failed to fetch absent records:", err);
        setError("Failed to fetch absent records.");
      } finally {
        setLoading(false);
      }
    };

    fetchAbsent();
  }, []);

  if (loading) {
    return <p className="p-4">Loading absent records...</p>;
  }

  if (error) {
    return <p className="p-4 text-red-500">{error}</p>;
  }

  if (data.length === 0) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-2">Absent Records</h2>
        <p className="text-gray-600">Absent for today's vidyow</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200">
      <h2 className="text-xl font-bold mb-4">Absent Records</h2>
      <table className="w-full text-sm text-left">
        <thead className="bg-red-50 text-red-800 text-xs uppercase">
          <tr>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, idx) => (
            <tr key={idx} className="border-b">
              <td className="px-4 py-2">{entry.date}</td>
              <td className="px-4 py-2">{entry.fullName}</td>
              <td className="px-4 py-2">{entry.remarks || "Absent"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Absent;
