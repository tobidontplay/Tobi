import { supabase } from '../../lib/supabase';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get query parameters
    const { timeRange = '30d', region, category } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Build query
    let query = supabase
      .from('sales_analytics')
      .select('*')
      .gte('sale_date', startDate.toISOString())
      .order('sale_date', { ascending: false });

    // Apply filters
    if (region) {
      query = query.eq('region', region);
    }
    if (category) {
      query = query.eq('category', category);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
}