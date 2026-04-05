import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "JamSheets"

interface TeamInviteProps {
  orgName?: string
  inviterName?: string
  role?: string
  joinUrl?: string
}

const TeamInviteEmail = ({ orgName, inviterName, role, joinUrl }: TeamInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{inviterName || 'Someone'} invited you to join {orgName || 'their team'} on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're invited! 🎸</Heading>
        <Text style={text}>
          {inviterName ? <strong>{inviterName}</strong> : 'A team admin'} has invited you to join{' '}
          <strong>{orgName || 'their workspace'}</strong> on {SITE_NAME}
          {role ? ` as a ${role}` : ''}.
        </Text>
        <Text style={text}>
          {SITE_NAME} helps touring bands manage shows, schedules, guest lists, and more — all from your phone.
        </Text>
        {joinUrl && (
          <Button style={button} href={joinUrl}>
            Join the team
          </Button>
        )}
        <Hr style={hr} />
        <Text style={footer}>
          If you weren't expecting this invite, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TeamInviteEmail,
  subject: (data: Record<string, any>) =>
    `You're invited to join ${data.orgName || 'a team'} on ${SITE_NAME}`,
  displayName: 'Team invite',
  previewData: {
    orgName: 'The Rolling Stones',
    inviterName: 'Mick',
    role: 'member',
    joinUrl: 'https://jammybuffet.com/join?token=abc123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '480px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#171717', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#737373', lineHeight: '1.6', margin: '0 0 16px' }
const button = {
  backgroundColor: '#171717',
  color: '#fafafa',
  borderRadius: '12px',
  fontSize: '14px',
  fontWeight: '600' as const,
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block' as const,
  margin: '8px 0 24px',
}
const hr = { borderColor: '#e8e8e8', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#a3a3a3', margin: '0' }
