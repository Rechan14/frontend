import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { API_ENDPOINTS } from "../../config/api";

interface Event {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  level: 'high' | 'medium' | 'low';
  isRead?: boolean;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const wsRef = useRef<WebSocket | null>(null);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(API_ENDPOINTS.CALENDARS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const allEvents: Event[] = res.data.map((event: any) => ({
        ...event,
        level: event.eventColor,
        isRead: false
      }));

      // Get the last seen event ID from localStorage
      const lastSeenEventId = parseInt(localStorage.getItem("lastSeenEventId") || "0", 10);
      
      // Mark events as read if they were seen before
      const updatedEvents = allEvents.map(event => ({
        ...event,
        isRead: event.id <= lastSeenEventId
      }));

      setEvents(updatedEvents);

      // Calculate unread count
      const newUnreadCount = updatedEvents.filter(event => !event.isRead).length;
      setUnreadCount(newUnreadCount);
      setNotifying(newUnreadCount > 0);
    } catch (error) {
      console.error("Failed to fetch events", error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchEvents();

    // Set up WebSocket connection
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const wsUrl = `${API_ENDPOINTS.WS}?token=${token}`;
    console.log('Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'reminder') {
        // Update unread count and fetch new events
        setUnreadCount(prev => prev + 1);
        setNotifying(true);
        fetchEvents();
      }
    };

    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchEvents, 30000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(intervalId);
    };
  }, []);

  const handleClick = () => {
    setIsOpen(!isOpen);
    setNotifying(false);
    
    if (events.length > 0) {
      // Mark all events as read
      const updatedEvents = events.map(event => ({
        ...event,
        isRead: true
      }));
      setEvents(updatedEvents);
      setUnreadCount(0);

      // Store the latest event ID
      const latestEventId = Math.max(...events.map(event => event.id));
      localStorage.setItem("lastSeenEventId", latestEventId.toString());
    }
  };

  const formatDate = (date: string) => {
    const newDate = new Date(date);
    return newDate.toLocaleDateString();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredEvents = events.filter(event => 
    (filterLevel === 'all' || event.level === filterLevel)
  );

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {notifying && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-5 w-5 rounded-full bg-orange-500 text-white text-xs font-bold shadow-md">
            {unreadCount}
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h5>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setFilterLevel('all')}
            className={`px-3 py-1 text-sm rounded-full ${
              filterLevel === 'all' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterLevel('high')}
            className={`px-3 py-1 text-sm rounded-full ${
              filterLevel === 'high' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}
          >
            High
          </button>
          <button
            onClick={() => setFilterLevel('medium')}
            className={`px-3 py-1 text-sm rounded-full ${
              filterLevel === 'medium' 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => setFilterLevel('low')}
            className={`px-3 py-1 text-sm rounded-full ${
              filterLevel === 'low' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}
          >
            Low
          </button>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {filteredEvents.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No Notification</p>
          ) : (
            [...filteredEvents].reverse().map((event, index) => {
              const isLatest = index === 0 && !event.isRead;
              return (
                <li key={event.id}>
                  <DropdownItem
                    onItemClick={() => setIsOpen(false)}
                    className={`flex flex-col items-start gap-1 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                      isLatest ? "bg-orange-50 dark:bg-orange-900/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {event.title}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getLevelColor(event.level)}`}>
                        {event.level}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Event date: {formatDate(event.startDate)}
                      {isLatest && (
                        <span className="ml-1 text-xs text-orange-500 font-semibold">New</span>
                      )}
                    </span>
                  </DropdownItem>
                </li>
              );
            })
          )}
        </ul>
      </Dropdown>
    </div>
  );
}