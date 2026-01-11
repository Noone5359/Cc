import emailjs from '@emailjs/browser';
import { useAuth } from '@features/auth/hooks/useAuth';
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Bug,
  Lightbulb,
  FileQuestion,
  Mail,
  Shield,
} from 'lucide-react';
import React, { useState, useRef, useMemo, useCallback } from 'react';

import { AdminHeader, SupportIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';

// Types
interface FormState {
  category: string;
  subject: string;
  message: string;
}

interface FormErrors {
  category?: string;
  subject?: string;
  message?: string;
}

// Floating Input Component
interface FloatingInputProps {
  id: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  icon: React.ElementType;
  error?: string;
  required?: boolean;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  id,
  name,
  type = 'text',
  value,
  onChange,
  label,
  icon: Icon,
  error,
  required,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className="relative group">
      <div className="relative">
        <Icon
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
            isFocused ? 'text-purple-500' : error ? 'text-red-500' : 'text-slate-400'
          }`}
        />
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className={`w-full pl-12 pr-4 py-4 bg-slate-800/50 border-2 rounded-xl outline-none transition-all duration-300 text-white placeholder-transparent peer ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-700 focus:border-purple-500'
          }`}
          placeholder={label}
        />
        <label
          htmlFor={id}
          className={`absolute left-12 transition-all duration-300 pointer-events-none ${
            isFocused || hasValue
              ? '-top-2.5 text-xs px-2 bg-slate-900 rounded'
              : 'top-1/2 -translate-y-1/2 text-sm'
          } ${isFocused ? 'text-purple-500' : error ? 'text-red-500' : 'text-slate-400'}`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

// Floating Textarea Component
interface FloatingTextareaProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  label: string;
  icon: React.ElementType;
  error?: string;
  required?: boolean;
  maxLength?: number;
  rows?: number;
}

const FloatingTextarea: React.FC<FloatingTextareaProps> = ({
  id,
  name,
  value,
  onChange,
  label,
  icon: Icon,
  error,
  required,
  maxLength = 1000,
  rows = 4,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className="relative group">
      <div className="relative">
        <Icon
          className={`absolute left-4 top-4 w-5 h-5 transition-colors duration-300 ${
            isFocused ? 'text-purple-500' : error ? 'text-red-500' : 'text-slate-400'
          }`}
        />
        <textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          maxLength={maxLength}
          rows={rows}
          className={`w-full pl-12 pr-4 py-4 bg-slate-800/50 border-2 rounded-xl outline-none transition-all duration-300 text-white placeholder-transparent resize-none ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-700 focus:border-purple-500'
          }`}
          placeholder={label}
        />
        <label
          htmlFor={id}
          className={`absolute left-12 transition-all duration-300 pointer-events-none ${
            isFocused || hasValue
              ? 'top-0 -translate-y-1/2 text-xs px-2 bg-slate-900 rounded'
              : 'top-4 text-sm'
          } ${isFocused ? 'text-purple-500' : error ? 'text-red-500' : 'text-slate-400'}`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      <div className="flex justify-between items-center mt-1.5">
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
        <span
          className={`text-xs ml-auto transition-colors ${
            value.length > maxLength * 0.9 ? 'text-amber-500' : 'text-slate-400'
          }`}
        >
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};

// Category option type
interface CategoryOption {
  value: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const categories: CategoryOption[] = [
  {
    value: 'general',
    label: 'General Inquiry',
    icon: HelpCircle,
    color: 'from-blue-500 to-blue-600',
  },
  { value: 'bug', label: 'Report a Bug', icon: Bug, color: 'from-red-500 to-red-600' },
  {
    value: 'feature',
    label: 'Feature Request',
    icon: Lightbulb,
    color: 'from-amber-500 to-amber-600',
  },
  { value: 'other', label: 'Other', icon: FileQuestion, color: 'from-purple-500 to-purple-600' },
];

const SupportEditor: React.FC = () => {
  const { currentUser } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [formState, setFormState] = useState<FormState>({
    category: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Get user's name and email
  const userName = currentUser?.displayName || 'Admin';
  const userEmail = currentUser?.email || '';

  // Calculate form completion percentage
  const formCompletion = useMemo(() => {
    const fields = ['category', 'subject', 'message'];
    const filledFields = fields.filter((field) => formState[field as keyof FormState].length > 0);
    return (filledFields.length / fields.length) * 100;
  }, [formState]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formState.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formState.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formState.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    if (!formState.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formState.message.trim().length < 20) {
      newErrors.message = 'Message must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCategorySelect = (category: string) => {
    setFormState((prev) => ({ ...prev, category }));
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // EmailJS configuration from environment variables
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      // Check if EmailJS is configured
      if (!serviceId || !templateId || !publicKey) {
        // Fallback to mailto if EmailJS is not configured
        console.warn('EmailJS not configured, falling back to mailto');
        const subject = encodeURIComponent(
          `[ADMIN] [${formState.category.toUpperCase()}] ${formState.subject}`
        );
        const body = encodeURIComponent(
          `Name: ${userName}\nEmail: ${userEmail}\nRole: Admin\nCategory: ${formState.category}\n\nMessage:\n${formState.message}`
        );
        window.location.href = `mailto:collegecentral01@gmail.com?subject=${subject}&body=${body}`;
        setSubmitStatus('success');
        return;
      }

      // Prepare template parameters for EmailJS
      const templateParams = {
        from_name: `${userName} (Admin)`,
        from_email: userEmail,
        admission_number: 'ADMIN',
        category: formState.category.charAt(0).toUpperCase() + formState.category.slice(1),
        subject: `[ADMIN] ${formState.subject}`,
        message: formState.message,
        to_email: 'collegecentral01@gmail.com',
      };

      // Send email using EmailJS
      await emailjs.send(serviceId, templateId, templateParams, publicKey);

      setSubmitStatus('success');

      // Reset form after success
      setTimeout(() => {
        setFormState({
          category: '',
          subject: '',
          message: '',
        });
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Failed to send email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminPageLayout>
      {/* Header */}
      <AdminHeader
        icon={<SupportIcon />}
        title="Support"
        subtitle="Get help or report issues with the admin dashboard"
      />

      {/* Contact Form */}
      <div className="relative">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="relative bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-slate-700 shadow-xl space-y-6"
        >
          {/* Form progress indicator */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Form completion</span>
              <span className="text-xs text-purple-400 font-mono font-semibold">
                {Math.round(formCompletion)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${formCompletion}%` }}
              />
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Select Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = formState.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategorySelect(cat.value)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? 'border-purple-500 bg-gradient-to-br from-purple-500/10 to-pink-500/10'
                        : 'border-slate-700 hover:border-purple-500/50 bg-slate-800/50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mb-2 w-fit mx-auto bg-gradient-to-br ${cat.color}`}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? 'text-purple-400' : 'text-slate-400'
                      }`}
                    >
                      {cat.label}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.category}
              </p>
            )}
          </div>

          {/* Admin Info Display */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* User Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-400 mb-1">Submitting as Admin</p>
                <h3 className="font-semibold text-white truncate">{userName}</h3>
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{userEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subject */}
          <FloatingInput
            id="subject"
            name="subject"
            value={formState.subject}
            onChange={handleInputChange}
            label="Subject"
            icon={MessageSquare}
            error={errors.subject}
            required
          />

          {/* Message */}
          <FloatingTextarea
            id="message"
            name="message"
            value={formState.message}
            onChange={handleTextareaChange}
            label="Your Message"
            icon={MessageSquare}
            error={errors.message}
            required
            maxLength={1000}
            rows={5}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending...</span>
              </div>
            ) : submitStatus === 'success' ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Message Sent!</span>
              </div>
            ) : submitStatus === 'error' ? (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>Something went wrong</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 relative z-10">
                <span>Send Message</span>
                <Send
                  size={18}
                  className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"
                />
              </div>
            )}
          </button>
        </form>
      </div>

      {/* Alternative Contact Info */}
      <div className="text-center">
        <p className="text-sm text-slate-400">
          You can also reach us directly at{' '}
          <a
            href="mailto:collegecentral01@gmail.com"
            className="text-purple-400 hover:underline font-medium"
          >
            collegecentral01@gmail.com
          </a>
        </p>
      </div>
    </AdminPageLayout>
  );
};

export default SupportEditor;
