import { useRef, useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners"; // Import the spinner

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [dateTime, setDateTime] = useState<string>(new Date().toLocaleString());
  const [hasTimedIn, setHasTimedIn] = useState<boolean>(false);
  const [hasTimedOut, setHasTimedOut] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendanceTimestamp, setAttendanceTimestamp] = useState<string | null>(null); // New state to store the timestamp
  const [lastActionTime, setLastActionTime] = useState<number | null>(null); // Track the last action time (Time In or Time Out)

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    // Retrieve last action time from localStorage on component mount
    const savedLastActionTime = localStorage.getItem("lastActionTime");
    if (savedLastActionTime) {
      setLastActionTime(Number(savedLastActionTime)); // Set it in the state
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setError("Error accessing webcam.");
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    startCamera();
    const interval = setInterval(() => {
      setDateTime(new Date().toLocaleString());
    }, 5000);

    fetchAttendanceStatus();

    return () => {
      clearInterval(interval);
      stopCamera();
    };
  }, []);

  const fetchAttendanceStatus = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`http://localhost:4000/attendances/latest/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch latest attendance");
      const data = await res.json();
      const attendance = data.data;

      if (attendance) {
        setHasTimedIn(true);
        setHasTimedOut(!!attendance.timeOut);
      } else {
        setHasTimedIn(false);
        setHasTimedOut(false);
      }

      localStorage.setItem(
        "attendanceStatus",
        JSON.stringify({ hasTimedIn: !!attendance, hasTimedOut: !!attendance?.timeOut })
      );
    } catch (err) {
      console.error("Error fetching attendance status:", err);
    }
  };

  useEffect(() => {
    const savedStatus = JSON.parse(localStorage.getItem("attendanceStatus") || "{}");
    if (savedStatus) {
      setHasTimedIn(savedStatus.hasTimedIn || false);
      setHasTimedOut(savedStatus.hasTimedOut || false);
    }
  }, []);

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (!context) return null;

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      context.translate(canvasRef.current.width, 0);
      context.scale(-1, 1);
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      return canvasRef.current.toDataURL("image/png");
    }
    return null;
  };

  const uploadImage = async (imageDataUrl: string, timestamp: string) => {
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    const file = new File([blob], `attendance-${timestamp}.png`, { type: "image/png" });

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("http://localhost:4000/uploads", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to upload image");
    const data = await res.json();
    return data.image.image_name;
  };

  const handleAttendance = async () => {
    try {
      // Check if the last action was less than 1 minutes ago
      const currentTime = Date.now();
      if (lastActionTime && currentTime - lastActionTime < 1 * 60 * 1000) {
        toast.error("Please wait 1 minute before clicking again.");
        return; // Prevent the action if it's within the 1-minute interval
      }

      setIsProcessing(true);
      setError(null);

      if (!user || !user.id) throw new Error("User is not logged in.");

      const now = new Date();
      const hours = now.getHours();
      const timestamp = now.toISOString().replace(/[:.]/g, "-");

      const imageDataUrl = await captureImage();
      if (!imageDataUrl) throw new Error("No image captured");

      const imageFilename = await uploadImage(imageDataUrl, timestamp);

      let shift = "Open Shift";
      if (hours >= 6 && hours < 14) shift = "Morning";
      else if (hours >= 14 && hours < 22) shift = "Afternoon";
      else if (hours >= 22 || hours < 6) shift = "Night";

      const res = await fetch("http://localhost:4000/attendances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          imageId: imageFilename,
          shifts: shift, 
          time: now.toISOString(),
        }),
      });

      if (!res.ok) {
        console.error("Failed to save attendance:", await res.text());
        throw new Error(`Failed to save attendance (Status: ${res.status})`);
      }

      const currentTimestamp = now.toLocaleString(); // Save the current timestamp after successful time-in or time-out

      // Set last action time to current time after a successful attendance action
      setLastActionTime(currentTime);
      localStorage.setItem("lastActionTime", currentTime.toString()); // Save it to localStorage

      if (!hasTimedIn) {
        setHasTimedIn(true);
        setHasTimedOut(false);
        setAttendanceTimestamp(currentTimestamp); // Set the timestamp
        localStorage.setItem("attendanceStatus", JSON.stringify({ hasTimedIn: true, hasTimedOut: false }));
        toast.success("Time In success!");
      } else {
        setHasTimedOut(true);
        setHasTimedIn(false);
        setAttendanceTimestamp(currentTimestamp); // Set the timestamp
        localStorage.setItem("attendanceStatus", JSON.stringify({ hasTimedIn: false, hasTimedOut: true }));
        toast.success("Time Out success!");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unexpected error.");
      toast.error("Error processing attendance.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
  document.body.style.overflow = "hidden"; // Hide the scrollbar globally when the component is mounted

  return () => {
    document.body.style.overflow = "auto"; // Reset the overflow style when the component is unmounted
  };
}, []);

 return (
    <div className="grid grid-cols-12 gap-4 p-4 dark:bg-gray-900 dark:text-white overflow-hidden">
      <ToastContainer position="top-right" style={{ marginTop: "80px" }} />
      <div className="col-span-12 flex flex-col items-center overflow-hidden">
        <p className="mb-2 text-gray-700 dark:text-gray-300 text-sm text-center">{dateTime}</p>

        <video
          ref={videoRef}
          autoPlay
          className="w-full max-w-sm aspect-square border rounded-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        <div className="mt-4 w-full flex justify-center">
          <button
            onClick={handleAttendance}
            disabled={isProcessing} // Disable if processing
            className="px-6 py-2 bg-blue-500 text-white rounded transition hover:bg-blue-600"
          >
            {isProcessing ? (
              <ClipLoader color="white" size={20} />
            ) : (
              hasTimedIn && !hasTimedOut ? "Time Out" : "Time In"
            )}
          </button>
        </div>

        {/* Show the attendance timestamp below the button */}
        {attendanceTimestamp && (
          <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-300">
            {hasTimedIn ? `Time In: ${attendanceTimestamp}` : `Time Out: ${attendanceTimestamp}`}
          </p>
        )}
      </div>
    </div>
  );
}