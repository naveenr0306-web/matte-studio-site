// ---------------------------------------------------------------------------
// Site settings — edit these, rebuild, and redeploy.
// ---------------------------------------------------------------------------
export const CONFIG = {
  // Contact email shown in the footer and used as a fallback if a form fails.
  email: 'hello@matte.studio',

  // Booking link (Cal.com or Calendly). Leave empty to use the built-in
  // "Book a free call" form instead.
  bookingUrl: '',

  // Where the forms send to. These are Cloudflare Pages Functions in /functions/api.
  forms: {
    review: '/api/review',
    book: '/api/contact',
  },

  // Social links (leave '' to hide nothing — the link just stays inactive).
  social: {
    instagram: '',
    linkedin: '',
    youtube: '',
  },

  // Pricing. Put plain numbers (e.g. 45000) in index.html data-monthly to have the
  // "Every 3 months" switch calculate the discounted price automatically.
  currency: '₹',
  quarterlyDiscount: 10, // percent
};
