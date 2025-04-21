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
  imageId: string | null; // Added for time-in image
  timeOutImageId: string | null; // Added for time-out image
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  employmentType?: string;
}

interface ActionLog {
  id: number;
  shiftId: number;
  userId: number;
  timeIn: string;
  timeOut: string;
  status: string;
}

export default function OpenShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserId(user.id);
  
      // Fetch current user detail
      fetch(`http://localhost:4000/accounts/${user.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch current user");
          return res.json();
        })
        .then((userData: User) => {
          setUsers([userData]); // Set as single-user array
        })
        .catch((error) => {
          console.error("Error fetching current user:", error);
        });
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
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("http://localhost:4000/attendances");
        if (!response.ok) throw new Error("Failed to fetch attendance records");
        const data: Shift[] = await response.json();
        const sortedShifts = data
          .filter((shift) => shift.userId === userId) // Only current user's shifts
          .sort((a, b) => {
            if (a.timeIn && b.timeIn) {
              return new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime(); // Sort descending
            }
            return a.timeIn ? -1 : 1;
          });
  
        setShifts(sortedShifts);
      } catch (error) {
        setError("Error fetching attendance records.");
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    };
  
    if (userId !== null) {
      fetchAttendance();
    }
  }, [userId]);

  useEffect(() => {
    const fetchActionLogs = async () => {
      try {
        const response = await fetch("http://localhost:4000/action-logs");
        if (!response.ok) throw new Error("Failed to fetch action logs");
        // const data: ActionLog[] = await response.json();
        // setActionLogs(data);
      } catch (error) {
        console.error("Error fetching action logs:", error);
      }
    };
    fetchActionLogs();
  }, []);

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    if (isNaN(date.getTime())) return "12:00 AM";
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleUpdateShift = async () => {
    if (!selectedShift || !selectedShift.id) return;

    try {
      const shiftDate = selectedShift.date;
      const formattedTimeIn = `${shiftDate}T${selectedShift.timeIn}`;
      const formattedTimeOut = `${shiftDate}T${selectedShift.timeOut}`;

      const actionLogResponse = await fetch("http://localhost:4000/action-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: selectedShift.id,
          userId: selectedShift.userId,
          timeIn: formattedTimeIn,
          timeOut: formattedTimeOut,
          status: "pending",
        }),
      });

      const actionLogData = await actionLogResponse.json();
      if (!actionLogResponse.ok) {
        throw new Error(actionLogData.message || "Failed to create action log");
      }

      toast.success("Shift update request submitted!", {
        position: "bottom-right",
        autoClose: 3000,
      });

      setShifts((prev) =>
        prev.map((shift) =>
          shift.id === selectedShift.id ? { ...shift, status: "pending" } : shift
        )
      );

      setSelectedShift(null);
    } catch (error) {
      console.error("Error creating action log:", error);
      toast.error("Something went wrong. Please try again.");
    }
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
    <PageBreadcrumb pageTitle="Home / Hours / Open Shift Logs" />
      <div className="p-6  rounded-lg shadow-md border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200">
      <div className="flex justify-between items-center mb-4">
        {/* <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow text-sm"
        >
          + Add Log
        </button> */}
      </div>
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
                <th className="border border-gray-100 dark:border-gray-800 p-3 text-sm font-semibold">Status</th>
                <th className="border border-gray-100 dark:border-gray-800 p-3 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700 dark:text-gray-300">
              {currentShifts.length > 0 ? (
                currentShifts.map((shift) => {
                     // Add console logs here to inspect image IDs
                    console.log('Time In Image ID:', shift.imageId);  // Log Time In Image ID
                    console.log('Time Out Image ID:', shift.timeOutImageId);  // Log Time Out Image ID
                  const pendingStatus = localStorage.getItem(`shift_${shift.id}_status`);
                  const displayStatus = shift.status === "approved" ? "approved" : pendingStatus || shift.status;

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
                            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} // Centers the image
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
                            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} // Centers the image
                          />
                        )}
                      </td>
                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm">{shift.totalHours ? Number(shift.totalHours).toFixed(2) : "-"}</td>
                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm">{getUserEmploymentType(shift.userId)}</td>
                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm font-semibold capitalize">{displayStatus}</td>
                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm">
                        <button
                          className="text-blue-600 hover:underline mr-2"
                          onClick={() => setSelectedShift(shift)}
                        >
                          Edit
                        </button>
                      </td>
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

        {/* Shift Edit Modal */}
        {selectedShift && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg max-w-sm w-full text-sm">
              <h3 className="text-lg font-semibold mb-4">Edit Shift</h3>
              <label className="block mb-2">
                Time In:
                <input
                  type="time"
                  className="w-full border p-2 mt-1 text-sm"
                  value={selectedShift.timeIn || ""}
                  onChange={(e) =>
                    setSelectedShift({ ...selectedShift, timeIn: e.target.value })
                  }
                />
              </label>
              <label className="block mb-2">
                Time Out:
                <input
                  type="time"
                  className="w-full border p-2 mt-1 text-sm"
                  value={selectedShift.timeOut || ""}
                  onChange={(e) =>
                    setSelectedShift({ ...selectedShift, timeOut: e.target.value })
                  }
                />
              </label>
              <div className="flex justify-end mt-4">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={handleUpdateShift}
                >
                  Submit
                </button>
                <button
                  className="ml-2 bg-gray-400 text-white px-4 py-2 rounded"
                  onClick={() => setSelectedShift(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer />
      </div>
    </>
  );
}