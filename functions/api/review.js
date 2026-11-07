import { handleForm } from '../../lib/send.js';
export const onRequestPost = (ctx) => handleForm(ctx, {
  subject: 'New free reel review request',
  required: ['reel', 'email'],
  fields: [['reel', 'Reel link'], ['email', 'Email'], ['page', 'Page']],
});
