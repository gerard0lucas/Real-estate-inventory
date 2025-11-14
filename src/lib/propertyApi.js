/**
 * Property API Client
 * Utility functions to add properties via API/webhook
 */

import { supabase } from './supabase'

/**
 * Add a property via API
 * @param {Object} propertyData - Property data object
 * @param {string} apiKey - Optional API key for webhook access (if not using JWT)
 * @returns {Promise<Object>} Response with success status and property data
 */
export async function addPropertyViaAPI(propertyData, apiKey = null) {
  try {
    // Get the current session token if available
    const { data: { session } } = await supabase.auth.getSession()
    
    // Use API key if provided, otherwise use JWT token
    const authHeader = apiKey 
      ? `Bearer ${apiKey}`
      : session?.access_token 
        ? `Bearer ${session.access_token}`
        : null

    if (!authHeader) {
      throw new Error('No authentication available. Please provide API key or login first.')
    }

    // Get Supabase URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is not configured')
    }

    // Call the Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/add-property`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify(propertyData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to add property')
    }

    return result
  } catch (error) {
    console.error('Error adding property via API:', error)
    throw error
  }
}

/**
 * Add a property via webhook (using API key)
 * This is useful for external services that don't have user authentication
 * @param {Object} propertyData - Property data object
 * @param {string} apiKey - API key for webhook access
 * @returns {Promise<Object>} Response with success status and property data
 */
export async function addPropertyViaWebhook(propertyData, apiKey) {
  if (!apiKey) {
    throw new Error('API key is required for webhook access')
  }
  
  return addPropertyViaAPI(propertyData, apiKey)
}

/**
 * Example usage:
 * 
 * // Using JWT token (from logged-in user)
 * const property = {
 *   project_id: 'uuid-here',
 *   agent_id: 'uuid-here', // Optional if using JWT
 *   title: '3BR Luxury Apartment',
 *   type: 'Apartment',
 *   price: 500000,
 *   description: 'Beautiful apartment...',
 *   bedrooms: 3,
 *   bathrooms: 2,
 *   area: 1200,
 *   address: '123 Main St',
 *   status: 'available',
 *   images: ['https://example.com/image1.jpg'],
 *   property_code_type: 'New Apartment'
 * }
 * 
 * const result = await addPropertyViaAPI(property)
 * 
 * // Using API key (for webhooks)
 * const result = await addPropertyViaWebhook(property, 'your-api-key')
 */

