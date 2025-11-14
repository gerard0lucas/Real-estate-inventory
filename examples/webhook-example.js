/**
 * Example: Adding a property via webhook/API
 * 
 * This example shows how to add a property using the API endpoint
 * from an external service or webhook.
 */

// Example 1: Using fetch API (Node.js/Browser)
async function addPropertyExample1() {
  const SUPABASE_URL = 'https://your-project.supabase.co'
  const API_KEY = 'your-api-key-here'
  const SUPABASE_ANON_KEY = 'your-supabase-anon-key'

  const propertyData = {
    agent_id: 'agent-uuid-here', // Required when using API key
    title: '3BR Luxury Apartment',
    type: 'Apartment',
    price: 500000,
    description: 'Beautiful modern apartment with stunning views',
    bedrooms: 3,
    bathrooms: 2,
    area: 1200,
    address: '123 Main Street, City, State 12345',
    status: 'available',
    images: [
      'https://example.com/images/property1.jpg',
      'https://example.com/images/property2.jpg'
    ],
    property_code_type: 'New Apartment', // Will auto-generate code like NA001
    owner_details: {
      name: 'John Doe',
      phone: '+1234567890'
    },
    broker_details: {
      name: 'Jane Smith',
      phone: '+0987654321'
    },
    price_per_sqft: 416.67,
    location_url: 'https://maps.google.com/?q=123+Main+Street'
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/add-property`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(propertyData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to add property')
    }

    console.log('Property added successfully:', result.data)
    return result.data
  } catch (error) {
    console.error('Error adding property:', error.message)
    throw error
  }
}

// Example 2: Using the client utility (if calling from frontend)
async function addPropertyExample2() {
  // Import the utility function
  // import { addPropertyViaWebhook } from '../src/lib/propertyApi'

  const propertyData = {
    agent_id: 'agent-uuid-here',
    title: '2BR Cozy House',
    type: 'House',
    price: 350000,
    bedrooms: 2,
    bathrooms: 1,
    area: 900,
    status: 'available',
    property_code_type: 'Old House' // Will generate OH001, OH002, etc.
  }

  try {
    // const result = await addPropertyViaWebhook(propertyData, 'your-api-key')
    // console.log('Property added:', result.data)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Example 3: Webhook handler (Express.js)
const express = require('express')
const app = express()

app.use(express.json())

app.post('/webhook/property', async (req, res) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL
    const API_KEY = process.env.PROPERTY_API_KEY
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

    // Validate incoming data
    const { title, type, price, agent_id } = req.body
    
    if (!title || !agent_id) {
      return res.status(400).json({ error: 'Title and agent_id are required' })
    }

    // Prepare property data
    const propertyData = {
      agent_id,
      title,
      type: type || 'Apartment',
      price: price ? parseFloat(price) : null,
      status: 'available',
      property_code_type: 'New Apartment'
    }

    // Call the API
    const response = await fetch(`${SUPABASE_URL}/functions/v1/add-property`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(propertyData)
    })

    const result = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(result)
    }

    res.status(201).json({
      success: true,
      message: 'Property added via webhook',
      data: result.data
    })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Example 4: Python webhook handler
/*
from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

@app.route('/webhook/property', methods=['POST'])
def add_property_webhook():
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    API_KEY = os.getenv('PROPERTY_API_KEY')
    SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
    
    data = request.json
    
    # Validate required fields
    if not data.get('title') or not data.get('agent_id'):
        return jsonify({'error': 'Title and agent_id are required'}), 400
    
    property_data = {
        'agent_id': data['agent_id'],
        'title': data['title'],
        'type': data.get('type', 'Apartment'),
        'price': data.get('price'),
        'bedrooms': data.get('bedrooms'),
        'bathrooms': data.get('bathrooms'),
        'area': data.get('area'),
        'status': 'available',
        'property_code_type': 'New Apartment'
    }
    
    response = requests.post(
        f'{SUPABASE_URL}/functions/v1/add-property',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {API_KEY}',
            'apikey': SUPABASE_ANON_KEY
        },
        json=property_data
    )
    
    if response.status_code == 201:
        return jsonify({
            'success': True,
            'data': response.json()['data']
        }), 201
    else:
        return jsonify(response.json()), response.status_code
*/

// Example 5: Minimal property (only required fields)
async function addMinimalProperty() {
  const minimalProperty = {
    agent_id: 'agent-uuid-here',
    title: 'Property Title' // Only required field
  }

  // Call API with minimal data
  // All other fields will be null/default
}

// Run example (uncomment to test)
// addPropertyExample1().catch(console.error)

module.exports = {
  addPropertyExample1,
  addPropertyExample2
}

