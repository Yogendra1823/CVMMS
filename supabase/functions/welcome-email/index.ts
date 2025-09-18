import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { email, name } = await req.json()

    // Here you would integrate with your email service (Resend, Mailgun, SendGrid, etc.)
    // For now, we'll just log the welcome email
    console.log(`Welcome email should be sent to: ${email}`)
    
    // Example with Resend (you would need to add your API key)
    /*
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CitizenVoiceMMS <noreply@citizenvoicemms.org>',
        to: [email],
        subject: 'Welcome to CitizenVoiceMMS Municipal Management System',
        html: `
          <h1>Welcome to CitizenVoiceMMS!</h1>
          <p>Dear ${name || 'Citizen'},</p>
          <p>Thank you for joining CitizenVoiceMMS Municipal Management System. You can now:</p>
          <ul>
            <li>Report municipal issues and complaints</li>
            <li>Track the status of your submissions</li>
            <li>Provide feedback on municipal services</li>
            <li>Contact municipal departments directly</li>
          </ul>
          <p>Visit <a href="https://citizenvoicemms.netlify.app">CitizenVoiceMMS</a> to get started.</p>
          <p>Best regards,<br>The CitizenVoiceMMS Team</p>
        `,
      }),
    })
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email queued successfully',
        email: email 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})