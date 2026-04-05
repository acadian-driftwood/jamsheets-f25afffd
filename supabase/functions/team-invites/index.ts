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
  const anonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ''

  // Validate caller's JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Use service role client to verify user and perform operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Verify the user's token
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

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

      const { error: emailError } = await supabase.functions.invoke('send-transactional-email', {
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

      if (emailError) {
        console.error('Failed to send invite email', emailError)
      }

      return new Response(JSON.stringify({ success: true, inviteId: invite.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'resend-invite') {
      const { inviteId, organizationId, orgName, inviterName } = body

      if (!inviteId || !organizationId) {
        return new Response(JSON.stringify({ error: 'inviteId and organizationId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Verify caller is admin/owner
      const { data: hasResendRole } = await supabase.rpc('has_org_role', {
        _user_id: user.id,
        _org_id: organizationId,
        _roles: ['owner', 'admin'],
      })
      if (!hasResendRole) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch the invite
      const { data: invite, error: fetchError } = await supabase
        .from('team_invites')
        .select('*')
        .eq('id', inviteId)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .maybeSingle()

      if (fetchError || !invite) {
        return new Response(JSON.stringify({ error: 'Invite not found or already accepted' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const siteUrl = req.headers.get('origin') || 'https://jammybuffet.com'
      const joinUrl = `${siteUrl}/join?token=${invite.token}`

      const { error: resendEmailError } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'team-invite',
          recipientEmail: invite.email,
          idempotencyKey: `team-invite-resend-${invite.id}-${Date.now()}`,
          templateData: {
            orgName: orgName || 'a team',
            inviterName: inviterName || 'A team admin',
            role: invite.role || 'member',
            joinUrl,
          },
        },
      })

      if (resendEmailError) {
        console.error('Failed to resend invite email', resendEmailError)
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'delete-invite') {
      const { inviteId, organizationId } = body
      if (!inviteId || !organizationId) {
        return new Response(JSON.stringify({ error: 'inviteId and organizationId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: hasDeleteRole } = await supabase.rpc('has_org_role', {
        _user_id: user.id,
        _org_id: organizationId,
        _roles: ['owner', 'admin'],
      })
      if (!hasDeleteRole) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: deleteError } = await supabase
        .from('team_invites')
        .delete()
        .eq('id', inviteId)
        .eq('organization_id', organizationId)

      if (deleteError) {
        return new Response(JSON.stringify({ error: 'Failed to delete invite' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'accept-invite') {
      const { token: inviteToken } = body
      if (!inviteToken) {
        return new Response(JSON.stringify({ error: 'Token required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: invite } = await supabase
        .from('team_invites')
        .select('*')
        .eq('token', inviteToken)
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
