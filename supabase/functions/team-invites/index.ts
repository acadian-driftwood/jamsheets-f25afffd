import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Get the caller's JWT from the Authorization header
  const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!, {
    global: { headers: { Authorization: `Bearer ${authHeader}` } },
  })
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  if (req.method === 'POST') {
    const { action, ...body } = await req.json()

    if (action === 'send-invite') {
      const { email, role, organizationId, orgName, inviterName } = body

      if (!email || !organizationId) {
        return new Response(JSON.stringify({ error: 'email and organizationId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Verify caller is admin/owner
      const { data: hasRole } = await supabase.rpc('has_org_role', {
        _user_id: user.id,
        _org_id: organizationId,
        _roles: ['owner', 'admin'],
      })
      if (!hasRole) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', (await supabase.from('profiles').select('id').eq('id', email).maybeSingle()).data?.id || '00000000-0000-0000-0000-000000000000')
        .maybeSingle()

      // Create invite record
      const { data: invite, error: inviteError } = await supabase
        .from('team_invites')
        .insert({
          organization_id: organizationId,
          email: email.toLowerCase(),
          role: role || 'member',
          invited_by: user.id,
        })
        .select()
        .single()

      if (inviteError) {
        if (inviteError.code === '23505') {
          return new Response(JSON.stringify({ error: 'This email already has a pending invite' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        console.error('Failed to create invite', inviteError)
        return new Response(JSON.stringify({ error: 'Failed to create invite' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Send invite email via transactional email system
      const siteUrl = req.headers.get('origin') || 'https://jammybuffet.com'
      const joinUrl = `${siteUrl}/join?token=${invite.token}`

      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'team-invite',
          recipientEmail: email.toLowerCase(),
          idempotencyKey: `team-invite-${invite.id}`,
          templateData: {
            orgName: orgName || 'a team',
            inviterName: inviterName || 'A team admin',
            role: role || 'member',
            joinUrl,
          },
        },
      })

      return new Response(JSON.stringify({ success: true, inviteId: invite.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'accept-invite') {
      const { token } = body
      if (!token) {
        return new Response(JSON.stringify({ error: 'Token required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: invite } = await supabase
        .from('team_invites')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle()

      if (!invite) {
        return new Response(JSON.stringify({ error: 'Invalid or expired invite' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: invite.organization_id,
          user_id: user.id,
          role: invite.role,
        })

      if (memberError) {
        if (memberError.code === '23505') {
          // Already a member, mark invite as accepted anyway
          await supabase.from('team_invites').update({ status: 'accepted' }).eq('id', invite.id)
          return new Response(JSON.stringify({ success: true, message: 'Already a member' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        return new Response(JSON.stringify({ error: 'Failed to join' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await supabase.from('team_invites').update({ status: 'accepted' }).eq('id', invite.id)

      return new Response(JSON.stringify({ success: true, organizationId: invite.organization_id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
