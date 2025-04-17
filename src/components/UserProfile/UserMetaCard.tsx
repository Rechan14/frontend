import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { toast } from "react-toastify";
import axios from "axios";

export default function UserMetaCard() {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  // Fetch profile image
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const response = await fetch(`http://localhost:4000/profile-uploads/${user?.id}`);
        if (!response.ok) throw new Error("Failed to fetch profile image");

        const data = await response.json();
        if (data.profile?.profile_image) {
          setProfileImage(`http://localhost:4000${data.profile.profile_image}`);
        }
      } catch (error) {
        console.error("Error fetching profile image:", error);
      }
    };

    if (user?.id) fetchProfileImage();
  }, [user?.id]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("profile_image", file);
    formData.append("account_id", user?.id ?? "");

    try {
      const response = await fetch("http://localhost:4000/profile-uploads", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setProfileImage(`http://localhost:4000${data.profile.profile_image}?${Date.now()}`);
      } else {
        console.error("Upload failed:", data.message);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetPassword = async () => {
    const { password, confirmPassword } = passwordFormData;
  
    // Check if both fields are filled
    if (!password || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }
  
    // Ensure passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
  
    setLoading(true);
  
    // Get token and user ID
    const token = localStorage.getItem("token");
    if (!token || !user?.id) {
      toast.error("Unauthorized: Missing token or user ID");
      setLoading(false);
      return;
    }
  
    try {
      // Prepare the request data, now including both 'password' and 'confirmPassword'
      const requestData = { password, confirmPassword };
  
      console.log("Request data:", requestData); // Debugging: log the data being sent
  
      const response = await axios.put(
        `http://localhost:4000/accounts/${user.id}`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,  // Send token for authorization
          },
        }
      );
  
      console.log("Backend response:", response); // Debugging: log the backend response
  
      if (response.status === 200) {
        toast.success("Password updated successfully!");
        setPasswordModalOpen(false);  // Close modal after success
        setPasswordFormData({ password: "", confirmPassword: "" });  // Reset form data
      } else {
        toast.error("Password update failed, please try again.");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || err.message;
        toast.error(`Error: ${message}`);
        console.log("Axios Error Response:", err.response?.data);  // Debugging
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An error occurred while updating your password.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="relative w-35 h-35 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
            <img
              src={profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName?.charAt(0) || "U")}&background=random&color=fff`}
              alt="User"
              onError={(e) => {
                e.currentTarget.src = "/images/default-profile.png";
              }}
              className="object-cover w-full h-full"
            />
            <label
              htmlFor="profile-image-upload"
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-sm cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
              aria-label="Upload profile image"
            >
              {isUploading ? "Uploading..." : profileImage ? "Change" : "Upload"}
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-2xl font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {user?.title || ""} {user?.firstName || "User"} {user?.lastName || ""}
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-base text-gray-500 dark:text-gray-400">{user?.role || "N/A"}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setPasswordModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] lg:inline-flex lg:w-auto"
        >
          <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206Z"
            />
          </svg>
          Change Password
        </button>
      </div>

      <Modal isOpen={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} className="max-w-md m-4">
        <div className="relative w-full p-4 bg-white rounded-3xl dark:bg-gray-900 lg:p-11">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Change Password</h4>
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleResetPassword();
            }}
          >
            <div className="grid grid-cols-1 gap-5">
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  name="password"
                  value={passwordFormData.password}
                  onChange={handlePasswordChange}
                />
              </div>

              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={passwordFormData.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={() => setPasswordModalOpen(false)}>
                Close
              </Button>
              <button
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg disabled:opacity-50"
                disabled={loading}
                type="submit"
              >
                {loading ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}