import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY 
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { file_url, file_name } = body;
    
    console.log('Received data:', { file_url, file_name });

    const { data, error } = await supabase
      .from('file_upload')
      .insert({ 
        file_url: file_url,
        file_name: file_name
      })
      .select();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json({ 
        error: `Insert failed: ${error.message}`,
        details: error
      }, { status: 500 });
    }

    console.log('Successfully saved:', data);
    return NextResponse.json({ 
      message: 'File URL saved successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ 
      error: `Server error: ${err.message}`,
      stack: err.stack
    }, { status: 500 });
  }
}
