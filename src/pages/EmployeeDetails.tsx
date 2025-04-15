import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

interface Account {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  title: string;
  role: string;
  country: string;
  city: string;
  department: string;
  employmentType: string;
  postalCode: string;
  email: string;
  phone: string;
  profile_image?: string | null;
}

const EmployeeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:4000/accounts/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch account details");
        const data: Account = await response.json();
        setAccount(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchProfileImage = async () => {
      try {
        const response = await fetch(`http://localhost:4000/profile-uploads/${id}`);
        if (!response.ok) throw new Error("Failed to fetch profile image");
        const data = await response.json();
        if (data.profile?.profile_image) {
          setProfileImage(`http://localhost:4000${data.profile.profile_image}?${Date.now()}`);
        }
      } catch (err) {
        console.error("Profile image fetch error:", err);
      }
    };

    if (id) {
      fetchAccountDetails();
      fetchProfileImage();
    }
  }, [id]);

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <>
    <PageBreadcrumb pageTitle="Home / Work Force / Employee Details" />
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
              {/* Profile Image */}
              <div className="relative w-35 h-35 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 hover:scale-110 transition-transform duration-300 ease-in-out">
                <img
                  src={
                    profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(account?.firstName?.charAt(0) || "U")}&background=random&color=fff`
                  }
                  alt="User"
                  onError={(e) => { e.currentTarget.src = "/images/default-profile.png"; }}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* User Details */}
              <div className="order-3 xl:order-2">
                <h4 className="mb-2 text-2xl font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                  {account?.title || ""} {account?.firstName || "User"} {account?.lastName || ""}
                </h4>
                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                  <p className="text-base text-gray-500 dark:text-gray-400">{account?.role || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                Personal Information
              </h4>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">First Name</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {account?.firstName || "User"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Last Name</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {account?.lastName || "User"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Email address</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {account?.email || "User"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {account?.phone || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Role</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {account?.role || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Employment Type</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {account?.employmentType || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Address */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                User Address
              </h4>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Country</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {account?.country || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">City/State</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {account?.city || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Postal Code</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {account?.postalCode || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeDetails;