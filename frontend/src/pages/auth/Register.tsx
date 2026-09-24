import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User,
  Building2,
  Lock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Upload,
  Phone,
  Briefcase,
  IdCard,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Check
} from 'lucide-react';

interface DepartmentOption {
  id: number;
  name: string;
  short_code: string;
}

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    fullName: '',
    phone: '',
    profilePhoto: '',

    // Step 2: Institution Information
    departmentId: '',
    designation: '',
    staffId: '',
    roleRequested: 'DEPARTMENT', // 'DEPARTMENT' or 'FACULTY'

    // Step 3: Account Information
    email: '',
    password: '',
    confirmPassword: '',

    // Step 4: Agreement
    acceptedTerms: false,
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/departments/`
        );
        setDepartments(res.data);
        if (res.data.length > 0 && !formData.departmentId) {
          setFormData((prev) => ({ ...prev, departmentId: res.data[0].id.toString() }));
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      setError('Please provide your full name.');
      return false;
    }
    if (formData.phone && !/^[+0-9\s-]{8,20}$/.test(formData.phone.trim())) {
      setError('Please enter a valid contact phone number.');
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!formData.departmentId) {
      setError('Please select your academic or administrative department.');
      return false;
    }
    if (!formData.designation.trim()) {
      setError('Please specify your current designation (e.g. Associate Professor, HOD).');
      return false;
    }
    if (!formData.staffId.trim()) {
      setError('Please provide your Employee / Staff ID.');
      return false;
    }
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please provide a valid email address.');
      return false;
    }

    const consumerDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    const domain = formData.email.split('@')[1]?.toLowerCase();
    if (consumerDomains.includes(domain)) {
      setError('Please use your official institutional email (e.g. @institute.edu, @college.ac.in). Personal webmail is not accepted.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Password confirmation does not match.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedTerms) {
      setError('Please confirm the institutional declaration before submitting.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/register`,
        {
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          confirm_password: formData.confirmPassword,
          staff_id: formData.staffId.trim(),
          phone: formData.phone.trim() || null,
          department_id: parseInt(formData.departmentId),
          designation: formData.designation.trim(),
          role_requested: formData.roleRequested,
          profile_image: formData.profilePhoto || null,
        }
      );

      setIsSuccess(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Registration failed. Please verify your details or contact the administrator.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDept = departments.find((d) => d.id.toString() === formData.departmentId);

  // Success view
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Status: PENDING ADMIN APPROVAL
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Registration Successfully Submitted!
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Your registration has been submitted for administrator approval. You will receive access once the portal administrator verifies your institutional appointment.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Applicant:</span>
              <span className="font-semibold text-slate-900">{formData.fullName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Official Email:</span>
              <span className="font-semibold text-slate-900">{formData.email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-slate-900">{selectedDept?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Requested Role:</span>
              <span className="font-semibold text-indigo-600">
                {formData.roleRequested === 'DEPARTMENT' ? 'Department Coordinator' : 'Faculty / Staff'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Personal Information', icon: User },
    { num: 2, label: 'Institution Details', icon: Building2 },
    { num: 3, label: 'Account Credentials', icon: Lock },
    { num: 4, label: 'Review & Submit', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
            AR
          </div>
          <div>
            <span className="text-base font-bold text-slate-900">Institute Portal</span>
            <span className="block text-[11px] text-indigo-600 font-semibold leading-none">
              Annual Report Management Portal
            </span>
          </div>
        </Link>
        <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition">
          Already registered? <span className="text-indigo-600 underline">Sign In</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-12">
        {/* Step Indicator Header */}
        <div className="bg-slate-900 p-6 text-white border-b border-slate-800">
          <h2 className="text-xl font-bold tracking-tight text-center">Institutional User Registration</h2>
          <p className="text-xs text-slate-400 text-center mt-1">
            Department Coordinators and Academic Faculty Onboarding
          </p>

          <div className="grid grid-cols-4 gap-2 mt-6">
            {steps.map((s) => {
              const isDone = currentStep > s.num;
              const isCurr = currentStep === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurr
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1.5 hidden sm:block ${
                      isCurr ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" /> Step 1: Personal Information
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Please provide your contact identity details.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Dr. Sangeeta Rao"
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91-9876543210"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Profile Photo URL (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Upload className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={formData.profilePhoto}
                    onChange={(e) => handleChange('profilePhoto', e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Institution Information */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" /> Step 2: Institutional Information
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Specify your academic department affiliation.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Department <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => handleChange('departmentId', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.short_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Designation / Academic Title <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => handleChange('designation', e.target.value)}
                    placeholder="e.g. Associate Professor / Annual Report Coordinator"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Staff / Employee ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <IdCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.staffId}
                    onChange={(e) => handleChange('staffId', e.target.value)}
                    placeholder="CSE-FAC-202"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Requested Portal Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      formData.roleRequested === 'DEPARTMENT'
                        ? 'bg-indigo-50/50 border-indigo-600 text-indigo-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Department Coordinator</span>
                      <input
                        type="radio"
                        name="roleRequested"
                        value="DEPARTMENT"
                        checked={formData.roleRequested === 'DEPARTMENT'}
                        onChange={(e) => handleChange('roleRequested', e.target.value)}
                        className="text-indigo-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Submit and manage annual report data for your department.
                    </span>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      formData.roleRequested === 'FACULTY'
                        ? 'bg-indigo-50/50 border-indigo-600 text-indigo-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Faculty / Staff</span>
                      <input
                        type="radio"
                        name="roleRequested"
                        value="FACULTY"
                        checked={formData.roleRequested === 'FACULTY'}
                        onChange={(e) => handleChange('roleRequested', e.target.value)}
                        className="text-indigo-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Contribute research, publications, and teaching accomplishments.
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  * Note: System Administrator accounts can only be provisioned by existing administrators.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Account Information */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" /> Step 3: Account Credentials
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Set up your secure institutional login.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Institutional Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="user@institute.edu"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Must be your verified institutional domain email (e.g. .edu, .ac.in).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Step 4: Review & Submit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Please review your registration details before final submission.</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 divide-y divide-slate-200/80 text-xs space-y-3">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-semibold text-slate-900">{formData.fullName}</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-500">Institutional Email</span>
                  <span className="font-semibold text-slate-900">{formData.email}</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-500">Department</span>
                  <span className="font-semibold text-slate-900">{selectedDept?.name}</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-500">Staff / Employee ID</span>
                  <span className="font-semibold text-slate-900">{formData.staffId}</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-500">Designation</span>
                  <span className="font-semibold text-slate-900">{formData.designation}</span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-500">Requested Role</span>
                  <span className="font-bold text-indigo-600">
                    {formData.roleRequested === 'DEPARTMENT' ? 'Department Coordinator' : 'Faculty / Staff'}
                  </span>
                </div>
                <div className="flex justify-between pt-3">
                  <span className="text-slate-500">Initial Account Status</span>
                  <span className="font-bold text-amber-600">PENDING APPROVAL</span>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  required
                  checked={formData.acceptedTerms}
                  onChange={(e) => handleChange('acceptedTerms', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  I declare that the information provided is accurate and represents my official institutional appointment at this institution.
                </span>
              </label>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
              >
                Cancel
              </Link>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 ml-auto"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-2 ml-auto disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Registration <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Annual Report Portal • Centralized Institutional Annual Report Management Platform
      </footer>
    </div>
  );
}
