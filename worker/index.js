// Cloudflare Worker entry: serves the built site from ./dist and handles the two form endpoints.
import { handleForm, handleReview } from '../lib/send.js';

const forms = {
  '/api/review': {
    subject: 'New free reel review request',
    required: ['reel', 'email'],
    fields: [['reel', 'Reel link'], ['email', 'Email'], ['page', 'Page']],
  },
  '/api/contact': {
    subject: 'New call request',
    required: ['name', 'email'],
    fields: [['name', 'Name'], ['email', 'Email'], ['service', 'Interested in'], ['brand', 'Brand / website'], ['message', 'Message'], ['page', 'Page']],
  },
};

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const form = forms[pathname];
    if (form) {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
      return pathname === '/api/review' ? handleReview({ request, env }) : handleForm({ request, env }, form);
    }
    return env.ASSETS.fetch(request);
  },
};
