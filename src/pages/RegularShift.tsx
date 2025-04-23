import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from "react-datepicker";

interface Shift {
  id: number;
  userId: number;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  totalHours: number | null;
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

export default function RegularShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // set for modal visibility
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Date picker state
  const [newShiftTimeIn, setNewShiftTimeIn] = useState<string>(''); // Time in state for new shift
  const [newShiftTimeOut, setNewShiftTimeOut] = useState<string>(''); // Time out state for new shift

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

        // Retrieve the user role from localStorage
        const storedUser = localStorage.getItem("user");
        if (!storedUser) throw new Error("User not found");

        const user = JSON.parse(storedUser);
        const isAdmin = user.role === "admin";

        const response = await fetch("http://localhost:4000/attendances");
        if (!response.ok) throw new Error("Failed to fetch attendance records");

        const data: Shift[] = await response.json();
        console.log("Raw attendance data from backend:", data);

        const filteredShifts = isAdmin
          ? data // Admin can see all shifts
          : data.filter((shift) => shift.userId === user.id); // Regular users see only their own shifts

        console.log("Filtered shifts with totalHours:", filteredShifts.map(shift => ({
          id: shift.id,
          timeIn: shift.timeIn,
          timeOut: shift.timeOut,
          totalHours: shift.totalHours,
          totalHoursType: typeof shift.totalHours,
          rawTotalHours: shift.totalHours
        })));

        // Fetch action logs for status update
        const actionLogsResponse = await fetch("http://localhost:4000/action-logs");
        const actionLogsData: ActionLog[] = await actionLogsResponse.json();

        // Update status based on action logs
        const updatedShifts = filteredShifts.map((shift) => {
          const actionLog = actionLogsData.find((log) => log.shiftId === shift.id);
          if (actionLog && actionLog.status === "pending") {
            return { ...shift, status: "pending" };
          }
          return { ...shift, status: shift.status || "" };
        });

        // Sort the shifts by timeIn
        const sortedShifts = updatedShifts.sort((a, b) => {
          if (a.timeIn && b.timeIn) {
            return new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime();
          }
          return a.timeIn ? -1 : 1;
        });

        console.log("Final shifts data before setting state:", sortedShifts);
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
        const data: ActionLog[] = await response.json();
        setActionLogs(data);
      } catch (error) {
        console.error("Error fetching action logs:", error);
      }
    };
    fetchActionLogs();
  }, []);

  const handleAddLog = async () => {
    if (!selectedDate || !newShiftTimeIn || !newShiftTimeOut) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      const formattedTimeIn = `${selectedDate.toISOString().split('T')[0]}T${newShiftTimeIn}`;
      const formattedTimeOut = `${selectedDate.toISOString().split('T')[0]}T${newShiftTimeOut}`;
      
      console.log('Formatted Time In:', formattedTimeIn);
      console.log('Formatted Time Out:', formattedTimeOut);
      
      // Calculate total hours
      const totalHours = calculateTotalHours(formattedTimeIn, formattedTimeOut);
      console.log('Calculated Total Hours:', totalHours);

      const actionLogResponse = await fetch("http://localhost:4000/action-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          shiftId: 0,
          timeIn: formattedTimeIn,
          timeOut: formattedTimeOut,
          totalHours: totalHours,
          status: "pending",
        }),
      });

      console.log('Request Body:', {
        userId: userId,
        shiftId: 0,
        timeIn: formattedTimeIn,
        timeOut: formattedTimeOut,
        totalHours: totalHours,
        status: "pending",
      });

      const actionLogData = await actionLogResponse.json();
      if (!actionLogResponse.ok) {
        throw new Error(actionLogData.message || "Failed to create action log");
      }

      toast.success("Shift log added successfully!", {
        position: "bottom-right",
        autoClose: 3000,
      });

      setIsModalOpen(false); 

    } catch (error: any) {
      toast.error("Something went wrong. Please try again.");
      console.error("Error adding action log:", error);
    }
  };

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    if (isNaN(date.getTime())) return "12:00 AM";
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const calculateTotalHours = (timeIn: string, timeOut: string) => {
    const timeInDate = new Date(timeIn);
    const timeOutDate = new Date(timeOut);
    
    console.log('Time In:', timeIn, 'Time Out:', timeOut);
    console.log('Time In Date:', timeInDate, 'Time Out Date:', timeOutDate);
    
    // If timeOut is before timeIn, it means it's the next day
    if (timeOutDate < timeInDate) {
      // Add 24 hours to timeOut
      timeOutDate.setDate(timeOutDate.getDate() + 1);
      console.log('Adjusted Time Out Date (next day):', timeOutDate);
    }
    
    const diffInMs = timeOutDate.getTime() - timeInDate.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    console.log('Difference in milliseconds:', diffInMs);
    console.log('Total Hours:', diffInHours);
    
    return diffInHours;
  };

  const handleUpdateShift = async () => {
    if (!selectedShift || !selectedShift.id) return;
  
    try {
      const shiftDate = selectedShift.date;
      const formattedTimeIn = `${shiftDate}T${selectedShift.timeIn}`;
      const formattedTimeOut = `${shiftDate}T${selectedShift.timeOut}`;
  
      // Calculate total hours
      const totalHours = calculateTotalHours(formattedTimeIn, formattedTimeOut);
  
      const actionLogResponse = await fetch("http://localhost:4000/action-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: selectedShift.id,
          userId: selectedShift.userId,
          timeIn: formattedTimeIn,
          timeOut: formattedTimeOut,
          totalHours: totalHours,
          status: "pending", // Status will be set here
        }),
      });
  
      const actionLogData = await actionLogResponse.json();
      if (!actionLogResponse.ok) {
        throw new Error(actionLogData.message || "Failed to create action log");
      }
  
      console.log("Action Log Submitted:", actionLogData); // Debug log
  
      // Only update the shift status if it's not already pending
      if (selectedShift.status !== "pending") {
        setShifts((prevShifts) =>
          prevShifts.map((shift) =>
            shift.id === selectedShift.id
              ? { ...shift, status: "pending" } // Update the specific shift's status
              : shift
          )
        );
      }
  
      toast.success("Shift update request submitted!", {
        position: "bottom-right",
        autoClose: 3000,
      });
  
      setSelectedShift(null); // Reset the selected shift
      setIsEditModalOpen(false); // <-- Mao ni ang crucial
      setIsModalOpen(false);
      
    } catch (error: any) {
      if (error?.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        console.error("Error creating action log:", error);
        toast.error("Something went wrong. Please try again.");
      }
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
    <PageBreadcrumb pageTitle="Home / Hours / Regular Shift Logs" />
      <div className="p-6  rounded-lg shadow-md border border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow text-sm">
            + Add Log
        </button>
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
                  // Remove localStorage check and only use shift status
                  const displayStatus = shift.status || "";
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
                          
                          // Calculate total hours from timeIn and timeOut
                          const timeInDate = new Date(shift.timeIn);
                          const timeOutDate = new Date(shift.timeOut);
                          
                          // If timeOut is before timeIn, it means it's the next day
                          if (timeOutDate < timeInDate) {
                            timeOutDate.setDate(timeOutDate.getDate() + 1);
                          }
                          
                          const diffInMs = timeOutDate.getTime() - timeInDate.getTime();
                          const totalHours = diffInMs / (1000 * 60 * 60);
                          
                          console.log('Calculated total hours:', {
                            timeIn: shift.timeIn,
                            timeOut: shift.timeOut,
                            totalHours: totalHours
                          });
                          
                          return totalHours.toFixed(2);
                        })()}
                      </td>
                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm">{getUserEmploymentType(shift.userId)}</td>
                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm font-semibold capitalize">{displayStatus}</td>
                      <td className="border border-gray-100 dark:border-gray-800 p-3 text-sm">
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => {
                            setSelectedShift(shift);
                            setIsEditModalOpen(true);
                          }}
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
        {isEditModalOpen && selectedShift && (
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

      {/* Modal for adding shift log */}
      {isModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Add Shift Log</h2>
                <div className="mb-4">
                  <label htmlFor="date" className="block text-sm font-semibold">Date</label>
                  <DatePicker
                    selected={selectedDate} // Siguraduhon nga selectedDate sakto ang value
                    onChange={(date) => setSelectedDate(date)} // Update selectedDate kung mag-usab
                    dateFormat="yyyy-MM-dd" // Gamiton ang paborito nga format
                    className="border rounded p-2" // Styling gamit ang Tailwind CSS
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="timeIn" className="block text-sm font-semibold">Time In</label>
                  <input
                    type="time"
                    id="timeIn"
                    value={newShiftTimeIn}
                    onChange={(e) => setNewShiftTimeIn(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="timeOut" className="block text-sm font-semibold">Time Out</label>
                  <input
                    type="time"
                    id="timeOut"
                    value={newShiftTimeOut}
                    onChange={(e) => setNewShiftTimeOut(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddLog}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow text-sm"
                  >
                    Save Log
                  </button>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}    
        <ToastContainer />
      </div>
    </>
  );
}