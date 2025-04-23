import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import PageBreadcrumb from "../components/common/PageBreadCrumb";

interface Shift {
  id: number;
  userId: number;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  totalHours: string | null;
  shifts: string;
  status: string;
  imageId: string | null;
  timeOutImageId: string | null;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  employmentType?: string;
}

export default function OpenShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleImageClick = (imageUrl: string) => {
    setModalImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImage(null);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:4000/attendances");
      if (!response.ok) throw new Error("Failed to fetch attendance records");
      const data: Shift[] = await response.json();

      // Fetch only shifts where the associated user's employmentType is 'Open-Shifts'
      const filteredShifts = data
        .filter((shift) => {
          const user = users.find((user) => user.id === shift.userId);
          return user?.employmentType === "Open-Shifts";
        })
        .sort((a, b) => {
          if (a.timeIn && b.timeIn) {
            return new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime();
          }
          return a.timeIn ? -1 : 1;
        });

      setShifts(filteredShifts);
    } catch (error) {
      setError("Error fetching attendance records.");
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserId(user.id);
    }
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:4000/accounts");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data: User[] = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (userId !== null) {
      fetchAttendance();
    }
  }, [userId, users]);

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    if (isNaN(date.getTime())) return "12:00 AM";
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const calculateTotalHours = (timeIn: string | null, timeOut: string | null) => {
    if (!timeIn || !timeOut) return null;
    
    const start = new Date(timeIn);
    const end = new Date(timeOut);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    
    if (end < start) {
      const nextDayEnd = new Date(end);
      nextDayEnd.setDate(nextDayEnd.getDate() + 1);
      const diffInMs = nextDayEnd.getTime() - start.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      return diffInHours;
    }
    
    const diffInMs = end.getTime() - start.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    return diffInHours;
  };

  const getUserFullName = (userId: number) => {
    const user = users.find((user) => user.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  const getUserEmploymentType = (userId: number) => {
    const user = users.find((user) => user.id === userId);
    return user ? user.employmentType ?? "Not Available" : "Not Available";
  };

  // Pagination Logic
  const indexOfLastShift = currentPage * itemsPerPage;
  const indexOfFirstShift = indexOfLastShift - itemsPerPage;
  const currentShifts = shifts.slice(indexOfFirstShift, indexOfLastShift);

  const totalPages = Math.ceil(shifts.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Home / To Do / Open Shift Logs" />
      <div className="p-6  rounded-lg shadow-md border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200">
        {loading && <p className="text-center text-gray-500">Loading shifts...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        <div className="overflow-hidden">
          <table className="w-full border border-gray-100 rounded-lg shadow-sm text-left">
            <thead className="bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:bg-white/[0.03]">
              <tr>
                <th className="border border-gray-100 dark:border-gray-800 p-3 text-sm font-semibold">Employee</th>
                <th className="border border-gray-100 dark:border-gray-800 p-3 text-sm font-semibold">Date</th>
                <th className="border border-gray-100 dark:border-gray-800 p-3 text-sm font-semibold">Time In</th>
                <th className="border border-gray-100 dark:border-gray-800 p-3 text-sm font-semibold">Time Out</th>
                <th className="border border-gray-100 dark:border-gray-800 p-3 text-sm font-semibold">Total Hours</th>
                <th className="border border-gray-100 dark:border-gray-800 p-3 text-sm font-semibold">Shifts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700 dark:text-gray-300">
              {currentShifts.length > 0 ? (
                currentShifts.map((shift) => {
                  return (
                    <tr key={shift.id} className="hover:bg-gray-100 dark:hover:bg-gray-900">
                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm">{getUserFullName(shift.userId)}</td>
                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm">{shift.date}</td>
                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm relative group">
                        {shift.timeIn ? formatTime(shift.timeIn) : "-"}
                        {shift.imageId && (
                          <img
                            src={`http://localhost:4000/uploads/${shift.imageId}`}
                            alt="Time In"
                            className="absolute inset-0 w-20 h-20 object-cover opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 ease-in-out"
                            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                          />
                        )}
                      </td>

                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm relative group">
                        {shift.timeOut ? formatTime(shift.timeOut) : "-"}
                        {shift.timeOutImageId && (
                          <img
                            src={`http://localhost:4000/uploads/${shift.timeOutImageId}`}
                            alt="Time Out"
                            className="absolute inset-0 w-20 h-20 object-cover opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 ease-in-out"
                            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                          />
                        )}
                      </td>
                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm">
                        {(() => {
                          if (!shift.timeIn || !shift.timeOut) return "-";
                          const totalHours = calculateTotalHours(shift.timeIn, shift.timeOut);
                          return totalHours ? totalHours.toFixed(2) : "-";
                        })()}
                      </td>
                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm">{getUserEmploymentType(shift.userId)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center p-4">
                    No shifts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>

        <ToastContainer />
      </div>
    </>
  );
}
