/**
 * College Information Configuration
 *
 * This file contains college-specific information that administrators can customize.
 * Only college/institution information should be stored here.
 */

export const COLLEGE_INFO = {
  // College Names
  name: {
    full: 'Indian Institute of Technology (Indian School of Mines) Dhanbad',
    short: 'IIT(ISM) Dhanbad',
    abbreviation: 'IIT(ISM)',
  },

  // Contact & Web
  email: {
    domain: 'iitism.ac.in',
    // Used for login validation - only emails from this domain will be allowed
    allowedDomain: '@iitism.ac.in',
  },

  website: {
    url: 'https://www.iitism.ac.in/',
    name: 'IIT(ISM) Website',
  },

  // Location
  location: {
    city: 'Dhanbad',
    state: 'Jharkhand',
    country: 'India',
  },
} as const;

// Helper function to get the full title for the application
export const getAppTitle = () => `College Central - ${COLLEGE_INFO.name.short} Student Portal`;

// Helper function to get email validation message
export const getEmailValidationMessage = () =>
  `Only ${COLLEGE_INFO.name.abbreviation} email addresses (${COLLEGE_INFO.email.allowedDomain}) are allowed. Please use your institutional email.`;
