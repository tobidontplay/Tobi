import { type NextRequest } from '@vercel/v0';
import { supabase } from '../../lib/supabase';

export async function verifyAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

export async function verifyAdmin(req: NextRequest) {
  const session = await verifyAuth(req);
  if (!session) return null;

  const { data: admin } = await supabase
    .from('admins')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  if (!admin) return null;

  return { ...session, role: admin.role };
}