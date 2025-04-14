import React, { useState } from "react";

interface LeaveFormProps {
  isOpen: boolean;
  closeModal: () => void;
}

const LeaveModal: React.FC<LeaveFormProps> = ({ isOpen, closeModal }) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    action: "",
    type: "",
    units: "",
    nextAccrual: "",
    schedule: "",
    earned: "",
    approved: "",
    availableBalance: "",
    pendingApproval: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.action || !formData.type || !formData.units) {
      alert("Action, type, and units are required.");
      return;
    }

    try {
      // Send the form data to the backend API
      const response = await fetch("http://localhost:4000/leaves", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Something went wrong with the submission');
      }

      // Parse the response data if needed
      const responseData = await response.json();
      console.log('Backend Response:', responseData);

      // Close the modal after successful submission
      closeModal();
    } catch (error) {
      console.error('Error submitting leave data:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200 p-8 rounded-lg w-96 shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">File a Leave</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <input
              type="text"
              name="employeeId"
              placeholder="Employee ID"
              value={formData.employeeId}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="action"
              placeholder="Action"
              value={formData.action}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="type"
              placeholder="Leave Type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="units"
              placeholder="Units"
              value={formData.units}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="nextAccrual"
              placeholder="Next Accrual"
              value={formData.nextAccrual}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="schedule"
              placeholder="Schedule"
              value={formData.schedule}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex space-x-4 mt-6">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Submit Leave
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );  
};

export default LeaveModal;