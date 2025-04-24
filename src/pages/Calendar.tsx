import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg, EventContentArg  } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    description?: string;
    category?: string;
    reminder?: {
      enabled: boolean;
      minutesBefore: number;
    };
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  eventColor: string;
  description?: string;
  category?: string;
  reminder?: {
    enabled: boolean;
    minutesBefore: number;
  };
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const categories = [
    "Meeting",
    "Appointment",
    "Task",
    "Personal",
    "Work",
    "Other"
  ];

  const reminderOptions = [
    { value: 5, label: "5 minutes before" },
    { value: 15, label: "15 minutes before" },
    { value: 30, label: "30 minutes before" },
    { value: 60, label: "1 hour before" },
    { value: 120, label: "2 hours before" },
    { value: 1440, label: "1 day before" }
  ];

  const eventLevels = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500"
  };

  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found in localStorage.");
        return;
      }

      try {
        const response = await fetch("http://localhost:4000/calendars", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 403) {
          console.error("Access denied. Token might be invalid or you don't have permission.");
          return;
        }

        const data = await response.json();

        let eventsToSet: CalendarEvent[] = [];

        if (data.length > 0) {
          eventsToSet = data.map((event: CalendarEvent) => ({
            id: event.id,
            title: event.title,
            start: event.startDate,
            end: event.endDate,
            allDay: true,
            extendedProps: {
              calendar: event.eventColor,
            },
          }));
        }
        
        setEvents(eventsToSet);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    setEventEndDate(event.end?.toISOString().split("T")[0] || "");
    setEventLevel(event.extendedProps.calendar);
    setEventDescription(event.extendedProps.description || "");
    setEventCategory(event.extendedProps.category || "");
    setReminderEnabled(event.extendedProps.reminder?.enabled || false);
    setReminderMinutes(event.extendedProps.reminder?.minutesBefore || 30);
    openModal();
  };

  const handleAddOrUpdateEvent = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    if (!eventTitle.trim() || !eventLevel.trim() || !eventStartDate || !eventEndDate) {
      setError("Title, level, and dates are required fields.");
      return;
    }

    const startDate = new Date(eventStartDate);
    const endDate = new Date(eventEndDate);

    if (startDate > endDate) {
      setError("End date cannot be before start date.");
      return;
    }

    const eventData = {
      title: eventTitle,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      eventColor: eventLevel,
      description: eventDescription,
      category: eventCategory,
      reminder: {
        enabled: reminderEnabled,
        minutesBefore: reminderMinutes
      }
    };

    setIsSubmitting(true);
    setError(null);

    try {
      let response;

      if (selectedEvent) {
        response = await fetch(`http://localhost:4000/calendars/${selectedEvent.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(eventData),
        });
      } else {
        response = await fetch("http://localhost:4000/calendars", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(eventData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save event");
      }

      // Schedule reminder if enabled
      if (reminderEnabled) {
        scheduleReminder(eventData);
      }

      closeModal();
      resetModalFields();
      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scheduleReminder = (eventData: any) => {
    const eventTime = new Date(eventData.startDate);
    const reminderTime = new Date(eventTime.getTime() - eventData.reminder.minutesBefore * 60000);
    
    if (reminderTime > new Date()) {
      setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification(`Upcoming Event: ${eventData.title}`, {
            body: eventData.description || "No description provided",
            icon: "/calendar-icon.png"
          });
        }
      }, reminderTime.getTime() - Date.now());
    }
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setEventDescription("");
    setEventCategory("");
    setReminderEnabled(false);
    setReminderMinutes(30);
    setSelectedEvent(null);
    setError(null);
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Home / Shift / Calendar" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Add Event +",
                click: openModal,
              },
            }}
            loading={(isLoading) => setLoading(isLoading)}
          />
        </div>

        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] p-6 lg:p-10">
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Edit Event" : "Add Event"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan your next big moment: schedule or edit an event to stay on track
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="mt-8 space-y-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 dark:border-gray-700 dark:text-white/90"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Description
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 dark:border-gray-700 dark:text-white/90"
                  placeholder="Add event details"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Category
                </label>
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 dark:border-gray-700 dark:text-white/90"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:text-white/90"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:text-white/90"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Level *
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(eventLevels).map(([key, color]) => (
                    <label
                      key={key}
                      htmlFor={`modal${key}`}
                      className="flex items-center cursor-pointer text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="relative">
                        <input
                          className="sr-only"
                          type="radio"
                          name="event-level"
                          value={key}
                          id={`modal${key}`}
                          checked={eventLevel === key}
                          onChange={() => setEventLevel(key)}
                        />
                        <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full dark:border-gray-700">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              eventLevel === key ? `${color}` : "hidden"
                            }`}
                          />
                        </span>
                      </span>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="reminderEnabled"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <label htmlFor="reminderEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Set Reminder
                  </label>
                </div>

                {reminderEnabled && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Reminder Time
                    </label>
                    <select
                      value={reminderMinutes}
                      onChange={(e) => setReminderMinutes(Number(e.target.value))}
                      className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 dark:border-gray-700 dark:text-white/90"
                    >
                      {reminderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                disabled={isSubmitting}
                type="button"
                className={`btn btn-success flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {selectedEvent ? "Updating..." : "Saving..."}
                  </span>
                ) : (
                  selectedEvent ? "Update Event" : "Add Event"
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const colorMap: { [key: string]: string } = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };

  const colorClass = colorMap[eventInfo.event.extendedProps.calendar] || "bg-gray-500";

  return (
    <div className={`flex items-center space-x-1 text-white px-2 py-1 rounded ${colorClass}`}>
      <div className="w-2 h-2 rounded-full bg-white"></div>
      <div className="text-xs">{eventInfo.timeText}</div>
      <div className="text-xs font-semibold">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;