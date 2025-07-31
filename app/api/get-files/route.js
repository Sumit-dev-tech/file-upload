import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY 
);

export async function GET(req) {
  try {
    // Fetch all uploaded files from database
    const { data, error } = await supabase
      .from('file_upload')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database fetch error:', error);
      return NextResponse.json({ 
        error: `Fetch failed: ${error.message}`,
        details: error
      }, { status: 500 });
    }

    console.log('Successfully fetched files:', data);
    return NextResponse.json({ 
      files: data || [],
      count: data?.length || 0
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ 
      error: `Server error: ${err.message}`,
      stack: err.stack
    }, { status: 500 });
  }
} 