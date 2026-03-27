import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ydhdfhlcznrnvmehmwnj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface AuthUser {
  uid: string;
  email: string;
  plan: string;
  role: string;
}

export function getUserFromRequest(req: NextRequest): AuthUser | null {
  const userId = req.headers.get('x-user-id');
  
  if (!userId) {
    return null;
  }

  return {
    uid: userId,
    email: '',
    plan: 'free',
    role: 'user'
  };
}

export async function validateUser(userId: string): Promise<AuthUser | null> {
  if (!supabase || !userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('uid, email, plan, role, active')
      .eq('uid', userId)
      .single();

    if (error || !data) {
      return null;
    }

    if (data.active === false) {
      return null;
    }

    return {
      uid: data.uid,
      email: data.email,
      plan: data.plan || 'free',
      role: data.role || 'user'
    };
  } catch {
    return null;
  }
}

export function unauthorized() {
  return { error: 'Unauthorized', status: 401 };
}

export function badRequest(message: string) {
  return { error: message, status: 400 };
}

export function serverError(message: string) {
  return { error: message, status: 500 };
}
