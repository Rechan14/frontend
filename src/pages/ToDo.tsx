import { List, Briefcase, Clock4Icon, AlarmClockCheck, ClockFading} from "lucide-react";  // Imported new icons
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

interface ActionLog {
  id: number;
  user: {
    fullName: string;
  };
  shiftId: number;
  details: string;
  status: string;
  timestamp: string;
}

const ToDo: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActionLog[]>([]);

  const fetchLogs = async () => {
    try {
      const response = await axios.get("http://localhost/action-logs");
      setLogs(response.data.filter((log: ActionLog) => log.status === "pending")); // Show only pending
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <>
      <PageBreadcrumb pageTitle="Home / To Do" />
      <div className="text-gray-800 dark:text-white/90 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <h2 className="text-2xl font-bold">ToDo</h2>

        {/* Inline buttons with separate background and border */}
        <div className="mt-6 flex justify-start gap-4 mb-4">
          <button
            onClick={() => navigate("/timesheet")}
            className="text-gray-800 dark:text-white/90 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6"
          >
            <List size={40} /> {/* Changed icon */}
            <span className="text-lg">Timesheet</span>
          </button>

          <button
            onClick={() => navigate("/todo-open-shifts")}
            className="text-gray-800 dark:text-white/90 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6"
          >
            <Briefcase size={40} /> {/* Changed icon */}
            <span className="text-lg">Open Shift</span>
          </button>

          <button
            onClick={() => navigate("/todo-regular-shifts")}
            className="text-gray-800 dark:text-white/90 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6"
          >
            <Clock4Icon size={40} /> {/* Changed icon */}
            <span className="text-lg">Regular Shift</span>
          </button>

          <button
            onClick={() => navigate("/todo-part-time-shifts")}
            className="text-gray-800 dark:text-white/90 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6"
          >
            <AlarmClockCheck size={40} /> {/* Changed icon */}
            <span className="text-lg">Part Time Shift</span>
          </button>

          <button
            onClick={() => navigate("/todo-apprenticeship-shifts")}
            className="text-gray-800 dark:text-white/90 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6"
          >
            <ClockFading size={40} /> {/* Changed icon */}
            <span className="text-lg">Apprenticeship</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ToDo;