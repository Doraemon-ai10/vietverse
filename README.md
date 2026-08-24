# 🇻🇳 VietVerse

VietVerse is a Vietnamese online game hub with account authentication, Google/Discord OAuth, email verification links, AI chat, community moderation, admin tools and a playable multiplayer game layer.

## Current build
- Responsive VietVerse lobby
- Email + password accounts with verification link (no 6-digit OTP)
- Google + Discord OAuth through Supabase Auth
- Signed HTTP-only sessions
- Vietnamese chat moderation
- Admin/moderation UI
- AI assistant integration
- **3D-style playable Vietnamese game world at `/game`**
- Nha Trang Life, Viet Battle, Nông Trại Việt and Đường Phố VN modes
- Multiplayer presence/broadcast through Supabase Realtime
- WASD / arrow-key movement
- In-game room chat

## Deployment
The repository is designed for Git-connected deployments such as Netlify. Set environment variables in the deployment provider; never commit secrets.

## Required production variables
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `PUBLIC_SITE_URL`
- `OPENROUTER_API_KEY` (optional, for AI)

## OAuth redirect URLs
For the production domain, configure Supabase Auth URL allowlists and provider settings to use:
- `https://YOUR_DOMAIN/api/auth/oauth/google/callback`
- `https://YOUR_DOMAIN/api/auth/oauth/discord/callback`

Do not expose service-role keys, session secrets, OAuth client secrets or AI provider keys in client code.
