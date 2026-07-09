'use client';
// File: src/components/ContactForm.tsx
// Purpose: Work-with-me inquiry form; posts to /api/contact (Resend)

import React, { useState } from 'react';
import { Send } from 'lucide-react';

const PROJECT_TYPES = [
  'AI systems & consulting',
  'Product / MVP build',
  'CRM & email systems',
  'Device / hardware',
  'Something else entirely',
];

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState(''); // honeypot
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, projectType, message, company }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Something went wrong');
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (status === 'success') {
    return (
      <div className="p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg text-center">
        <p className="text-lg font-semibold text-green-800 dark:text-green-300 mb-1">
          Got it — talk soon.
        </p>
        <p className="text-sm text-green-700 dark:text-green-300">
          Your message is in my inbox. I usually reply within a day.
        </p>
      </div>
    );
  }

  const inputClasses =
    'w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow';

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClasses}
            placeholder="Your name"
            required
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasses}
            placeholder="you@example.com"
            required
            maxLength={200}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-type" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          What are you building?
        </label>
        <select
          id="contact-type"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          className={inputClasses}
        >
          <option value="">Pick the closest fit (optional)</option>
          {PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Tell me about it
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClasses} min-h-[120px] resize-y`}
          placeholder="The idea, the problem, the timeline — whatever you've got. Rough is fine."
          required
          maxLength={5000}
        />
      </div>

      {/* Honeypot — hidden from real visitors, catnip for bots */}
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-500">
          {errorMessage}{' '}
          <a href="mailto:sean.munley@protonmail.com" className="underline">
            Or email me directly.
          </a>
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {status === 'sending' ? 'Sending…' : 'Send it'}
      </button>
    </form>
  );
}
