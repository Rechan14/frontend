import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { signUp } from "../../api";
import Select from "react-select";

export default function SignUpForm() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [title, setTitle] = useState("Mr.");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentType, setemploymentType] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const [countries, setCountries] = useState<{ label: string; value: string }[]>([]);
  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);

  const navigate = useNavigate();

  const capitalizeFirstLetter = (name: string) =>
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch countries");
        return res.json();
      })
      .then((data: Array<{ name: { common: string } }>) => {
        const countryOptions = data.map((country) => ({
          label: country.name.common,
          value: country.name.common,
        }));
        setCountries(
          countryOptions.sort((a, b) => a.label.localeCompare(b.label))
        );
      })
      .catch((error) => {
        console.error("Error fetching countries:", error);
        setError("Failed to load countries. Please try again later.");
      });
  }, []);
  
  useEffect(() => {
    if (country) {
      fetch("https://countriesnow.space/api/v0.1/countries/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      })
        .then((res) => res.json())
        .then(
          (data: {
            error: boolean;
            msg: string;
            data: string[];
          }) => {
            const cityOptions = (data.data || []).map((city) => ({
              label: city,
              value: city,
            }));
            setCities(
              cityOptions.sort((a, b) => a.label.localeCompare(b.label))
            );
          }
        )
        .catch((error) => console.error("Error fetching cities:", error));
    }
  }, [country]);  

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError(confirmPassword && e.target.value !== confirmPassword ? "Passwords do not match" : "");
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setPasswordError(password && e.target.value !== password ? "Passwords do not match" : "");
  };

  const handleNext = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (step === 1) {
      if (!firstName || !lastName || !department || !employmentType || !email || !phone || !password || !confirmPassword) {
        setError("All fields are required");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      setStep(2);
    } else {
      if (!country || !city || !postalCode) {
        setError("Please select your country, city, and postal code");
        return;
      }
      if (!acceptTerms) {
        setError("You must accept the terms and conditions");
        return;
      }
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await signUp({
        title,
        firstName,
        lastName,
        department,
        employmentType,
        email,
        phone,
        password,
        confirmPassword: password,
        country,
        city,
        postalCode,
        acceptTerms,
      });
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Signup failed");
        }
      }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === 1 ? "Enter your details to continue." : "Enter your address details."}
            </p>
          </div>
          <form onSubmit={handleNext}>
            <div className="space-y-5">
              {step === 1 && (
                <>
                  {/* Title */}
                  <div>
                    <Label>Title</Label>
                    <select
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full p-2 border rounded-lg text-gray-500 dark:text-gray-400"
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Mrs.">Mrs.</option>
                    </select>
                  </div>

                  <div>
                    <Label>First Name<span className="text-error-500">*</span></Label>
                    <Input type="text" placeholder="Enter your first name" value={firstName} onChange={(e) => setFirstName(capitalizeFirstLetter(e.target.value))} />
                  </div>
                  <div>
                    <Label>Last Name<span className="text-error-500">*</span></Label>
                    <Input type="text" placeholder="Enter your last name" value={lastName} onChange={(e) => setLastName(capitalizeFirstLetter(e.target.value))} />
                  </div>
                  <div>
                    <Label>Department<span className="text-error-500">*</span></Label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full p-2 border rounded-lg text-gray-500 dark:text-gray-400"
                    >
                      <option value="" disabled>-- Select Department --</option>
                      <option value="Accountant">Accountant</option>
                      <option value="IT">IT</option>
                      <option value="Associate">Associate</option>
                      <option value="Operation">Operation</option>
                    </select>
                  </div>
                  <div>
                    <Label>Employment Type<span className="text-error-500">*</span></Label>
                    <select
                      value={employmentType}
                      onChange={(e) => setemploymentType(e.target.value)}
                      className="w-full p-2 border rounded-lg text-gray-500 dark:text-gray-400"
                    >
                      <option value="" disabled>-- Select Employment Type --</option>
                      <option value="Regular">Regular</option>
                      <option value="Part-Time">Part Time</option>
                      <option value="Apprenticeship">Apprenticeship</option>
                      <option value="Open-Shifts">Open Shifts</option>
                    </select>
                  </div>
                  <div>
                    <Label>Email<span className="text-error-500">*</span></Label>
                    <Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label>Phone<span className="text-error-500">*</span></Label>
                    <Input type="tel" placeholder="Enter your phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label>Password<span className="text-error-500">*</span></Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={handlePasswordChange} />
                      <span onClick={() => setShowPassword(!showPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                        {showPassword ? <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>Confirm Password<span className="text-error-500">*</span></Label>
                    <div className="relative">
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={handleConfirmPasswordChange} />
                      <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                        {showConfirmPassword ? <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />}
                      </span>
                    </div>
                  </div>
                  {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                  <button type="button" onClick={handleNext} className="w-full bg-brand-500 text-white rounded-lg py-3">
                    Next
                  </button>
                </>
              )}
                {step === 2 && (
                  <>
                    <div>
                      <Label>Country<span className="text-error-500">*</span></Label>
                      <Select
                        options={countries}
                        value={countries.find((c) => c.value === country)}
                        onChange={(selected) => {
                          setCountry(selected?.value || "");
                          setCity(""); // reset city when changing country
                        }}
                        placeholder="Select your country"
                        className="text-sm"
                      />
                    </div>
                    {country && (
                      <div>
                        <Label>City/State<span className="text-error-500">*</span></Label>
                        <Select
                          options={cities}
                          value={cities.find((c) => c.value === city)}
                          onChange={(selected) => setCity(selected?.value || "")}
                          placeholder="Select your city"
                          className="text-sm"
                        />
                      </div>
                    )}
                    {city && (
                      <div>
                        <Label>Postal Code<span className="text-error-500">*</span></Label>
                        <Input type="text" placeholder="Enter your postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                      </div>
                    )}
                  <div className="flex items-center gap-3">
                    <Checkbox checked={acceptTerms} onChange={setAcceptTerms} />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      I accept the <span className="text-gray-800 dark:text-white/90">Terms and Conditions</span> and <span className="text-gray-800 dark:text-white">Privacy Policy</span>.
                    </p>
                  </div>
                  <button type="button" onClick={() => setStep(1)} className="w-full bg-gray-500 text-white rounded-lg py-3">
                    Back
                  </button>
                  <button type="submit" className="w-full bg-brand-500 text-white rounded-lg py-3">
                    {loading ? "Signing Up..." : "Sign Up"}
                  </button>
                </>
              )}
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}