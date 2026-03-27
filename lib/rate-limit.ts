import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ydhdfhlcznrnvmehmwnj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  
  const existing = inMemoryStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    inMemoryStore.set(key, {
      count: 1,
      resetTime: now + WINDOW_MS
    });
    
    return {
      success: true,
      remaining: MAX_REQUESTS - 1,
      resetIn: WINDOW_MS
    };
  }
  
  if (existing.count >= MAX_REQUESTS) {
    return {
      success: false,
      remaining: 0,
      resetIn: existing.resetTime - now
    };
  }
  
  existing.count++;
  
  return {
    success: true,
    remaining: MAX_REQUESTS - existing.count,
    resetIn: existing.resetTime - now
  };
}

export function getIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  
  return ip;
}

export function getUserIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  return `ip:${getIdentifier(req)}`;
}
