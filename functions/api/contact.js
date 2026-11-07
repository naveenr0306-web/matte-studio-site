import { handleForm } from '../../lib/send.js';
export const onRequestPost = (ctx) => handleForm(ctx, {
  subject: 'New call request',
  required: ['name', 'email'],
  fields: [['name', 'Name'], ['email', 'Email'], ['service', 'Interested in'], ['brand', 'Brand / website'], ['message', 'Message'], ['page', 'Page']],
});
