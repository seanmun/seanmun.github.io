// File: src/lib/vault.ts
// Purpose: The speakeasy door in front of the classified projects. Server
// only. The site's repo is public, so neither the password nor the projects
// may live in it: the password is the VAULT_PASSWORD env var and the
// projects are the Firestore `vault_projects` collection, read only after a
// visitor has answered both questions.
//
// Flow: knock → password → "the red or the white?" → white → a signed,
// httpOnly pass cookie. Between the two questions the client carries a
// short-lived signed ticket, so the second answer can't be tried alone.

import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase-admin';

export const VAULT_COOKIE = 'vault_pass';
const PASS_MS = 30 * 24 * 60 * 60 * 1000; // a returning guest skips the door for a month
const TICKET_MS = 2 * 60 * 1000; // time allowed between the password and the wine
const WINE = 'white';

export interface VaultProject {
  id: string;
  order: number;
  title: string;
  status: 'Dev' | 'MVP' | 'Prod';
  tagline?: string;
  description: string;
  techStack: string[];
  link?: string;
  linkLabel?: string;
}

function secret() {
  return process.env.VAULT_PASSWORD ?? '';
}

// "OPEN  Sesame!" → "open sesame": case, spacing and punctuation don't matter
export function normalizeAnswer(value: unknown) {
  return typeof value === 'string'
    ? value.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function safeEquals(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function sign(purpose: string, expiresAt: number) {
  return createHmac('sha256', secret()).update(`${purpose}:${expiresAt}`).digest('hex');
}

function issue(purpose: string, lifetimeMs: number) {
  const expiresAt = Date.now() + lifetimeMs;
  return `${expiresAt}.${sign(purpose, expiresAt)}`;
}

function verify(purpose: string, token: unknown) {
  if (!secret() || typeof token !== 'string') return false;
  const [expiresAt, signature] = token.split('.');
  const expiry = Number(expiresAt);
  if (!expiry || !signature || Date.now() > expiry) return false;
  return safeEquals(signature, sign(purpose, expiry));
}

export const vaultConfigured = () => secret().length > 0;

export function checkPassword(answer: unknown) {
  return vaultConfigured() && safeEquals(normalizeAnswer(answer), normalizeAnswer(secret()));
}

export function checkWine(answer: unknown) {
  return normalizeAnswer(answer).replace(/^the /, '') === WINE;
}

export const issueTicket = () => issue('ticket', TICKET_MS);
export const verifyTicket = (ticket: unknown) => verify('ticket', ticket);

export function passCookie() {
  return {
    name: VAULT_COOKIE,
    value: issue('pass', PASS_MS),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: PASS_MS / 1000,
  };
}

export async function hasVaultPass() {
  return verify('pass', (await cookies()).get(VAULT_COOKIE)?.value);
}

export async function getVaultProjects(): Promise<VaultProject[]> {
  const snapshot = await db.collection('vault_projects').orderBy('order').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<VaultProject, 'id'>) }));
}
