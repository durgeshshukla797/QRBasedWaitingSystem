//A slug is a human-readable version of a name or title used in a URL
// Without a slug -->waitingsystem.com/blog/12345
//With a slug-->waitingsystem.com/blog/how-to-learn-node-js
//slug is used to make the URL more readable and SEO friendly

import crypto from 'crypto';

export const makeSlug = (name) => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'queue';
  const suffix = crypto.randomBytes(3).toString('hex'); // 6 characters
  return `${base}-${suffix}`;
};