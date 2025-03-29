import { createRoute } from '@vercel/v0';
import { supabase } from '../../lib/supabase';
import { verifyAuth } from '../middleware/auth';

export const POST = createRoute(async (req) => {
  const session = await verifyAuth(req);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_id: session.user.id,
        ...body,
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    return new Response(error.message, { status: 400 });
  }
});

export const GET = createRoute(async (req) => {
  const session = await verifyAuth(req);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('id');

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        delivery_tracking (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    return new Response(error.message, { status: 400 });
  }
});