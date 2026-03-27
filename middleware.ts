import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getUserIdentifier } from './lib/rate-limit';

const PUBLIC_API_PATHS = ['/api/webhook', '/api/webhooks/stripe', '/api/whatsapp'];
const LIMITED_API_PATHS = ['/api/ai', '/api/audio', '/api/checkout'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!path.startsWith('/api/')) {
    return NextResponse.next();
  }

  const isWebhook = PUBLIC_API_PATHS.some(p => path.startsWith(p));
  
  if (isWebhook) {
    return NextResponse.next();
  }

  const isLimitedAPI = LIMITED_API_PATHS.some(p => path.startsWith(p));
  
  if (!isLimitedAPI) {
    return NextResponse.next();
  }

  const userId = request.headers.get('x-user-id') || undefined;
  const identifier = getUserIdentifier(request, userId);
  
  const { success, remaining, resetIn } = await checkRateLimit(identifier);
  
  const response = NextResponse.next();
  
  response.headers.set('X-RateLimit-Limit', '30');
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil((Date.now() + resetIn) / 1000).toString());
  
  if (!success) {
    return new NextResponse('Rate limit exceeded', {
      status: 429,
      headers: {
        'Retry-After': Math.ceil(resetIn / 1000).toString(),
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': '0'
      }
    });
  }
  
  return response;
}

export const config = {
  matcher: '/api/:path*'
};
