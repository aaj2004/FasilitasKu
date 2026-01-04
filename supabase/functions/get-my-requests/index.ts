import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, requestId, nim } = await req.json();

    console.log('get-my-requests called with:', { email, phone: phone ? '***' : null, requestId, nim: nim ? '***' : null });

    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let student = null;

    // Search by NIM if provided
    if (nim) {
      const { data: studentByNim, error: nimError } = await supabase
        .from('students')
        .select('id')
        .eq('nim', nim)
        .maybeSingle();

      if (nimError) {
        console.error('Error finding student by NIM:', nimError);
        return new Response(
          JSON.stringify({ error: 'Failed to find student' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!studentByNim) {
        console.log('No student found for NIM');
        return new Response(
          JSON.stringify({ requests: [], request: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      student = studentByNim;
    } 
    // Search by email and phone
    else if (email && phone) {
      const { data: studentByEmailPhone, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .eq('phone', phone)
        .maybeSingle();

      if (studentError) {
        console.error('Error finding student:', studentError);
        return new Response(
          JSON.stringify({ error: 'Failed to find student' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!studentByEmailPhone) {
        console.log('No student found for email/phone combination');
        return new Response(
          JSON.stringify({ requests: [], request: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      student = studentByEmailPhone;
    } else {
      console.error('Missing search criteria (nim or email+phone)');
      return new Response(
        JSON.stringify({ error: 'NIM or Email and phone are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If requestId is provided, fetch single request
    if (requestId) {
      const { data: request, error: requestError } = await supabase
        .from('requests')
        .select(`
          *,
          facility:facilities(*),
          student:students(*)
        `)
        .eq('id', requestId)
        .eq('student_id', student.id)
        .maybeSingle();

      if (requestError) {
        console.error('Error fetching request:', requestError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch request' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Returning single request:', request ? request.id : 'null');
      return new Response(
        JSON.stringify({ request }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all requests for this student
    const { data: requests, error: requestsError } = await supabase
      .from('requests')
      .select(`
        *,
        facility:facilities(*),
        student:students(*)
      `)
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch requests' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Returning ${requests?.length || 0} requests for student ${student.id}`);
    return new Response(
      JSON.stringify({ requests: requests || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
