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
    const { requestId, email, phone, filePath } = await req.json();

    console.log('get-document-url called with:', { requestId, email, filePath: filePath ? '***' : null });

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if request comes from admin (via authorization header)
    const authHeader = req.headers.get('authorization');
    let isAdmin = false;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        // Check if user is admin
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'super_admin'])
          .maybeSingle();
        
        isAdmin = !!adminRole;
      }
    }

    // If not admin, validate student ownership
    if (!isAdmin) {
      if (!email || !phone || !requestId) {
        console.error('Missing required fields for student access');
        return new Response(
          JSON.stringify({ error: 'Email, phone, and requestId are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .eq('phone', phone)
        .maybeSingle();

      if (studentError || !student) {
        console.error('Student not found');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify student owns this request
      const { data: request, error: requestError } = await supabase
        .from('requests')
        .select('id, document_url')
        .eq('id', requestId)
        .eq('student_id', student.id)
        .maybeSingle();

      if (requestError || !request) {
        console.error('Request not found or not owned by student');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Determine the file path to generate URL for
    let targetPath = filePath;
    
    if (!targetPath && requestId) {
      // Get document_url from request
      const { data: request } = await supabase
        .from('requests')
        .select('document_url')
        .eq('id', requestId)
        .single();
      
      targetPath = request?.document_url;
    }

    if (!targetPath) {
      return new Response(
        JSON.stringify({ error: 'No document found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL (1 hour expiry)
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(targetPath, 3600);

    if (error) {
      console.error('Error generating signed URL:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate document URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generated signed URL for:', targetPath);
    return new Response(
      JSON.stringify({ url: data.signedUrl }),
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
