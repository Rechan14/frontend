import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import Select from "react-select";
import "react-toastify/dist/ReactToastify.css";
import PageBreadcrumb from "../components/common/PageBreadCrumb";

const roles = ["Admin", "User"];
const departments = ["Accountant", "IT", "Associate", "Operations"];
const employmentTypes = ["Open-Shifts", "Regular", "Part-Time", "Apprenticeship"];
const titles = ["Mr", "Mrs", "Miss", "Ms"];

const AddAccount: React.FC = () => {
  const [step, setStep] = useState(1);

  const [newAccount, setNewAccount] = useState({
    title: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "",
    department: "",
    employmentType: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    city: "",
    postalCode: "",
  });

  const [countries, setCountries] = useState<{ label: string; value: string }[]>([]);
  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      if (decoded.role) setUserRole(decoded.role);
    } catch (error) {
      console.error("Token decoding error:", error);
    }
  }, []);

  interface Country {
    name: {
      common: string;
      official: string;
      nativeName?: Record<string, { official: string; common: string }>;
    };
  }
  
  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all")
      .then((res) => res.json())
      .then((data: Country[]) => {
        const countryOptions = data.map((c) => ({
          label: c.name.common,
          value: c.name.common,
        }));
        setCountries(
          countryOptions.sort((a, b) => a.label.localeCompare(b.label))
        );
      })
      .catch((error) => console.error("Error fetching countries:", error));
  }, []);

  useEffect(() => {
    if (newAccount.country) {
      fetch("https://countriesnow.space/api/v0.1/countries/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: newAccount.country }),
      })
        .then((res) => res.json())
        .then((data) => {
          const cityOptions = (data.data || []).map((city: string) => ({
            label: city,
            value: city,
          }));
          setCities(cityOptions);
        })
        .catch((error) => console.error("Error fetching cities:", error));
    }
  }, [newAccount.country]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAccount((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSelectChange = (name: string, selected: { label: string; value: string } | null) => {
    const value = selected?.value || "";
    setNewAccount((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateField = (name: string, value: string) => {
    let error = "";
    if (!value.trim()) error = "This field is required";
    else {
      if (name === "email" && !/^\S+@\S+\.\S+$/.test(value)) error = "Invalid email format";
      if (name === "password" && value.length < 6) error = "Password must be at least 6 characters";
      if (name === "confirmPassword" && value !== newAccount.password) error = "Passwords do not match";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const isStepValid = () => {
    let requiredFields: string[] = [];

    if (step === 1) {
      requiredFields = ["title", "firstName", "lastName", "phone", "email", "password", "confirmPassword"];
    } else if (step === 2) {
      requiredFields = ["role", "employmentType", "department"];
    } else if (step === 3) {
      requiredFields = ["country", "city", "postalCode"];
    }

    const newErrors: { [key: string]: string } = {};
    requiredFields.forEach((field) => {
      if (!newAccount[field as keyof typeof newAccount]?.trim()) newErrors[field] = "This field is required";
    });

    if (step === 1 && newAccount.password !== newAccount.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (isStepValid()) setStep((prev) => prev + 1);
  };

  const handlePrevious = () => setStep((prev) => prev - 1);

  const handleAddAccount = async () => {
    if (!isStepValid()) return;

    const token = localStorage.getItem("token");
    if (!token || userRole !== "Admin") {
      toast.error("Unauthorized or no token", { position: "bottom-right" });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:4000/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAccount),
      });

      if (!response.ok) throw new Error(await response.text());

      toast.success("Account added successfully!", { position: "bottom-right" });
      setTimeout(() => (window.location.href = "/workforce"), 1000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add account", { position: "bottom-right" });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            {[
              { label: "Title", name: "title", type: "select", options: titles },
              { label: "First Name", name: "firstName", type: "text" },
              { label: "Last Name", name: "lastName", type: "text" },
              { label: "Phone", name: "phone", type: "text" },
              { label: "Email", name: "email", type: "email" },
              { label: "Password", name: "password", type: "password" },
              { label: "Confirm Password", name: "confirmPassword", type: "password" },
            ].map(({ label, name, type, options }) => (
              <div key={name} className="flex flex-col">
                <label className="font-semibold text-gray-300">{label}</label>
                {type === "select" ? (
                  <select
                    name={name}
                    value={newAccount[name as keyof typeof newAccount]}
                    onChange={handleInputChange}
                    className="border p-3 bg-gray-700 text-gray-300 rounded-md"
                  >
                    <option value="">Select {label}</option>
                    {options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={type}
                    name={name}
                    placeholder={label}
                    value={newAccount[name as keyof typeof newAccount]}
                    onChange={handleInputChange}
                    className="border p-3 bg-gray-700 text-gray-300 rounded-md"
                  />
                )}
                {errors[name] && <p className="text-red-500 text-sm">{errors[name]}</p>}
              </div>
            ))}
          </>
        );

      case 2:
        return (
          <>
            {[
              { label: "Role", name: "role", options: roles },
              { label: "Employment Type", name: "employmentType", options: employmentTypes },
              { label: "Department", name: "department", options: departments },
            ].map(({ label, name, options }) => (
              <div key={name} className="flex flex-col">
                <label className="font-semibold text-gray-300">{label}</label>
                {options ? (
                  <select
                    name={name}
                    value={newAccount[name as keyof typeof newAccount]}
                    onChange={handleInputChange}
                    className="border p-3 bg-gray-700 text-gray-300 rounded-md"
                  >
                    <option value="">Select {label}</option>
                    {options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name={name}
                    placeholder={label}
                    value={newAccount[name as keyof typeof newAccount]}
                    onChange={handleInputChange}
                    className="border p-3 bg-gray-700 text-gray-300 rounded-md"
                  />
                )}
                {errors[name] && <p className="text-red-500 text-sm">{errors[name]}</p>}
              </div>
            ))}
          </>
        );

      case 3:
        return (
          <>
            <div className="flex flex-col">
              <label className="font-semibold text-gray-300">Country</label>
              <Select
                options={countries}
                onChange={(selected) => handleSelectChange("country", selected)}
                className="text-black"
                placeholder="Select country"
              />
              {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
            </div>

            <div className="flex flex-col">
              <label className="font-semibold text-gray-300">City</label>
              <Select
                options={cities}
                onChange={(selected) => handleSelectChange("city", selected)}
                className="text-black"
                placeholder="Select city"
                isDisabled={!newAccount.country}
              />
              {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
            </div>

            <div className="flex flex-col">
              <label className="font-semibold text-gray-300">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                placeholder="Postal Code"
                value={newAccount.postalCode}
                onChange={handleInputChange}
                className="border p-3 bg-gray-700 text-gray-300 rounded-md"
              />
              {errors.postalCode && <p className="text-red-500 text-sm">{errors.postalCode}</p>}
            </div>
          </>
        );
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Home / Work Force / Add Account" />
      <div className="p-8 rounded-2xl shadow-2xl max-w-5xl mx-auto bg-gradient-to-br from-gray-800 to-gray-900 text-gray-300">
        <div className="mb-8">
          <p className="text-gray-400">Please fill in the required information below</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= stepNumber
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`h-1 w-24 mx-2 ${
                      step > stepNumber ? "bg-blue-500" : "bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>Personal Info</span>
            <span>Work Details</span>
            <span>Location</span>
          </div>
        </div>

   
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{renderStep()}</div>

          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                onClick={handlePrevious}
                className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Previous
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 ml-auto"
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleAddAccount}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 ml-auto"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        
        <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar theme="dark" />
      </div>
    </>
  );
};

export default AddAccount;