import { useAppConfig } from '@contexts/AppConfigContext';
import { useUser } from '@contexts/UserContext';
import emailjs from '@emailjs/browser';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import React, { useState, useRef, useMemo, useCallback } from 'react';

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
            isFocused
              ? 'text-primary dark:text-secondary'
              : error
                ? 'text-red-500'
                : 'text-slate-400'
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
          className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder-transparent peer ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-200 dark:border-slate-700 focus:border-primary dark:focus:border-secondary'
          }`}
          placeholder={label}
        />
        <label
          htmlFor={id}
          className={`absolute left-12 transition-all duration-300 pointer-events-none ${
            isFocused || hasValue
              ? '-top-2.5 text-xs px-2 bg-white dark:bg-dark-card rounded'
              : 'top-1/2 -translate-y-1/2 text-sm'
          } ${
            isFocused
              ? 'text-primary dark:text-secondary'
              : error
                ? 'text-red-500'
                : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
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
            isFocused
              ? 'text-primary dark:text-secondary'
              : error
                ? 'text-red-500'
                : 'text-slate-400'
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
          className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 rounded-xl outline-none transition-all duration-300 text-slate-900 dark:text-white placeholder-transparent resize-none ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-200 dark:border-slate-700 focus:border-primary dark:focus:border-secondary'
          }`}
          placeholder={label}
        />
        <label
          htmlFor={id}
          className={`absolute left-12 transition-all duration-300 pointer-events-none ${
            isFocused || hasValue
              ? 'top-0 -translate-y-1/2 text-xs px-2 bg-white dark:bg-dark-card rounded'
              : 'top-4 text-sm'
          } ${
            isFocused
              ? 'text-primary dark:text-secondary'
              : error
                ? 'text-red-500'
                : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      <div className="flex justify-between items-center mt-1.5">
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
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

const Support: React.FC = () => {
  const { user } = useUser();
  const { config } = useAppConfig();
  const formRef = useRef<HTMLFormElement>(null);
  const [formState, setFormState] = useState<FormState>({
    category: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Get email domain from config
  const emailDomain = config?.collegeInfo?.email?.domain || 'college.edu';

  // Get user's name and email
  const userName = user?.name || user?.fullName || '';
  const userEmail = user?.email || `${user?.admissionNumber?.toLowerCase()}@${emailDomain}` || '';

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
          `[${formState.category.toUpperCase()}] ${formState.subject}`
        );
        const body = encodeURIComponent(
          `Name: ${userName}\nEmail: ${userEmail}\nAdmission No: ${user?.admissionNumber || 'N/A'}\nCategory: ${formState.category}\n\nMessage:\n${formState.message}`
        );
        window.location.href = `mailto:collegecentral01@gmail.com?subject=${subject}&body=${body}`;
        setSubmitStatus('success');
        return;
      }

      // Prepare template parameters for EmailJS
      const templateParams = {
        from_name: userName,
        from_email: userEmail,
        admission_number: user?.admissionNumber || 'N/A',
        category: formState.category.charAt(0).toUpperCase() + formState.category.slice(1),
        subject: formState.subject,
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl mb-4">
            <HelpCircle className="w-10 h-10 text-primary dark:text-secondary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-3">
            How Can We Help?
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Have a question, found a bug, or want to suggest a feature? We'd love to hear from you.
            Fill out the form below and we'll get back to you soon.
          </p>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 50 }}
          className="relative group"
        >
          {/* Animated gradient border for form */}
          <motion.div
            className="absolute -inset-[2px] bg-gradient-to-r from-primary via-secondary to-primary rounded-3xl opacity-30 group-hover:opacity-60 blur-sm transition-opacity duration-500"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '200% 200%' }}
          />

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="relative bg-white dark:bg-dark-card backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-primary/30 dark:hover:border-secondary/30 transition-all duration-300 shadow-xl"
          >
            {/* Form progress indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Form completion
                </span>
                <span className="text-xs text-primary dark:text-secondary font-mono font-semibold">
                  {Math.round(formCompletion)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${formCompletion}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Select Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((cat) => {
                    const IconComponent = cat.icon;
                    const isSelected = formState.category === cat.value;
                    return (
                      <motion.button
                        key={cat.value}
                        type="button"
                        onClick={() => handleCategorySelect(cat.value)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                          isSelected
                            ? 'border-primary dark:border-secondary bg-gradient-to-br from-primary/10 to-secondary/10'
                            : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-secondary/50 bg-slate-50 dark:bg-slate-800/50'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg mb-2 w-fit mx-auto bg-gradient-to-br ${cat.color}`}
                        >
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            isSelected
                              ? 'text-primary dark:text-secondary'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {cat.label}
                        </span>
                        {isSelected && (
                          <motion.div
                            layoutId="category-indicator"
                            className="absolute -top-1 -right-1 w-5 h-5 bg-primary dark:bg-secondary rounded-full flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <CheckCircle className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                <AnimatePresence>
                  {errors.category && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="mt-2 text-xs text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.category}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* User Info Display */}
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 rounded-xl p-4 border border-primary/20 dark:border-secondary/20">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={userName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-primary/30 dark:border-secondary/30"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-dark-card flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Submitting as</p>
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {userName}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
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
              <motion.button
                type="submit"
                disabled={isSubmitting || Object.keys(errors).length > 0}
                whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative shadow-lg hover:shadow-xl"
              >
                {/* Animated shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ x: ['0%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
                />

                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </motion.div>
                  ) : submitStatus === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Message Sent!</span>
                    </motion.div>
                  ) : submitStatus === 'error' ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5" />
                      <span>Something went wrong</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="send"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2 relative z-10"
                    >
                      <span>Send Message</span>
                      <Send
                        size={18}
                        className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Alternative Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You can also reach us directly at{' '}
            <a
              href="mailto:collegecentral01@gmail.com"
              className="text-primary dark:text-secondary hover:underline font-medium"
            >
              collegecentral01@gmail.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default React.memo(Support);
