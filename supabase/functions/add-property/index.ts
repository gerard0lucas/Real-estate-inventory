import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the API key or JWT token
    // Option 1: Check if it's a valid JWT token (for authenticated users)
    // Option 2: Check if it's a custom API key (for webhooks)
    const token = authHeader.replace('Bearer ', '')
    
    // Check if it's a custom API key (you can set this in Supabase secrets)
    const apiKey = Deno.env.get('PROPERTY_API_KEY')
    let userId: string | null = null
    let isAdmin = false

    if (apiKey && token === apiKey) {
      // Using API key - allow but set a default agent_id or require it in payload
      // For API key, we'll use the agent_id from the request body
    } else {
      // Try to verify as JWT token
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authorization token' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      userId = user.id
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      isAdmin = profile?.role === 'admin'
    }

    // Parse request body
    const body = await req.json()
    const {
      project_id,
      agent_id,
      title,
      type,
      price,
      description,
      bedrooms,
      bathrooms,
      area,
      address,
      status = 'available',
      images = [],
      property_code,
      property_code_type,
      owner_details,
      broker_details,
      price_per_sqft,
      location_url
    } = body

    // Validation
    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If using API key, agent_id must be provided
    if (apiKey && token === apiKey && !agent_id) {
      return new Response(
        JSON.stringify({ error: 'agent_id is required when using API key' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use userId from token if available, otherwise use provided agent_id
    const finalAgentId = userId || agent_id

    // Verify agent_id exists if provided
    if (finalAgentId) {
      const { data: agentProfile, error: agentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', finalAgentId)
        .single()

      if (agentError || !agentProfile) {
        return new Response(
          JSON.stringify({ error: 'Invalid agent_id' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Verify project_id exists if provided
    if (project_id) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', project_id)
        .single()

      if (projectError || !project) {
        return new Response(
          JSON.stringify({ error: 'Invalid project_id' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Generate property code if not provided but property_code_type is provided
    let finalPropertyCode = property_code
    if (!finalPropertyCode && property_code_type) {
      const isNew = property_code_type.includes('New')
      const propertyType = property_code_type.replace(/^(New|Old)\s+/, '')
      
      const { data: generatedCode, error: codeError } = await supabase.rpc('generate_property_code', {
        property_type: propertyType,
        is_new: isNew
      })

      if (!codeError && generatedCode) {
        finalPropertyCode = generatedCode
      }
    }

    // Prepare property data
    const propertyData: any = {
      project_id: project_id || null,
      agent_id: finalAgentId || null,
      title,
      type: type || null,
      price: price ? parseFloat(price) : null,
      description: description || null,
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      area: area ? parseFloat(area) : null,
      address: address || null,
      status: status || 'available',
      images: Array.isArray(images) ? images : [],
      property_code: finalPropertyCode || null,
      property_code_type: property_code_type || null,
      owner_details: owner_details || null,
      broker_details: broker_details || null,
      price_per_sqft: price_per_sqft ? parseFloat(price_per_sqft) : null,
      location_url: location_url || null
    }

    // Insert property
    const { data, error } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Property added successfully',
        data 
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

