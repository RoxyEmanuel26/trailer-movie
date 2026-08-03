import { NextResponse } from 'next/server';
import { getCurrentSession, requireAdmin } from '@/lib/auth/utils';

export async function GET() {
  try {
    const session = await getCurrentSession();

    // We try to verify admin logic, but if not authenticated, we just return the session state.
    if (!session) {
      return NextResponse.json({ authenticated: false, message: 'No session found' });
    }

    // Attempt to require admin logic to test DB fetch
    try {
      const adminData = await requireAdmin();
      return NextResponse.json({
        authenticated: true,
        user: adminData.user,
        message: 'Session and admin check passed (User has a role)',
      });
    } catch (adminError: any) {
      return NextResponse.json({
        authenticated: true,
        user: session.user,
        message: 'Session valid, but admin check failed: ' + adminError.message,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
