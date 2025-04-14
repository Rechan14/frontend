import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
  };
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

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
          eventsToSet = data.map((event: any) => ({
            id: event.id,
            title: event.title,
            start: event.startDate,
            end: event.endDate,
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
    openModal();
  };

  const handleAddOrUpdateEvent = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Cannot add or update event.");
      return;
    }
  
    if (!eventStartDate || !eventEndDate) {
      console.error("Event start and end dates are required.");
      return;
    }
  
    const startDate = new Date(eventStartDate).toISOString().split("T")[0];
    const endDate = new Date(eventEndDate).toISOString().split("T")[0];
  
    const eventColorMap: { [key: string]: string } = {
      Danger: "red",
      Success: "green",
      Primary: "blue",
      Warning: "yellow",
    };
    const eventColor = eventColorMap[eventLevel] || "gray";
  
    const eventData = {
      title: eventTitle,
      startDate: startDate,
      endDate: endDate,
      eventColor: eventColor || null,
    };
  
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
        const errorMessage = await response.text();
        console.error("Error adding/updating event:", errorMessage);
        setError(errorMessage);
        return;
      }
  
      // Reload the page after adding/updating event
      window.location.reload(); // Add this line to reload the page
  
      closeModal();
      resetModalFields();
    } catch (error) {
      console.error("Error adding/updating event:", error);
      setError("Something went wrong. Please try again.");
    }
  };
  
  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
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
          />
        </div>

        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Edit Event" : "Add Event"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan your next big moment: schedule or edit an event to stay on track
              </p>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <div className="mt-8">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 dark:border-gray-700 dark:text-white/90"
                />
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter Start Date
                </label>
                <input
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:text-white/90"
                />
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter End Date
                </label>
                <input
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:text-white/90"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              >
                Close
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {selectedEvent ? "Update Changes" : "Add Event"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const colorMap: { [key: string]: string } = {
    Danger: "bg-red-500",
    Success: "bg-green-500",
    Primary: "bg-blue-500",
    Warning: "bg-yellow-500",
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