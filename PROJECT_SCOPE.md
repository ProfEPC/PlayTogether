# PlayTogether - Future Scope & Roadmap

## Current MVP Status ✅

- **Backend:** Node.js + Express + Socket.IO (in-memory state)
- **Frontend:** React + Vite + TypeScript
- **Games:** Infiltration (8 players), Odd One Out (3-12 players)
- **Features:** Room creation, player join, character selection, reveal powers, basic voting/results
- **Hosting:** Local development only
- **Color System:** Themeable color constants ✅

---

## PRIORITY CHANGES: New Roadmap Order

**OLD ORDER:**

1. Graphics → Database → Production → Advanced features

**NEW ORDER (User Decision):**

1. **Phase 1: Production Deployment** ← START HERE (1-2 days)
2. **Phase 2: Mobile Web Browser** ← Parallel (1 week)
3. Phase 3: Graphics & Visual Polish
4. Phase 4: Database & Persistence
5. Phase 5-9: Advanced features

---

## Phase 1: Production Deployment (PRIORITY 1 - GO LIVE)

### Timeline: 1-2 days

### Backend Hosting

- **Recommended:** Railway, Render, or DigitalOcean
- **Cost:** $10-30/mo
- **Setup:**
  - Dockerize Node.js server (or use platform's buildpacks)
  - Set environment variables (BACKEND_URL, etc.)
  - Enable CORS for production frontend domain
  - Add rate limiting to prevent abuse
- **What deploys:**
  - Socket.IO server with production config
  - Existing game logic (no changes needed)
- **Checklist:**
  - [ ] Create hosting account
  - [ ] Connect GitHub repo to host
  - [ ] Set up environment variables
  - [ ] Deploy backend
  - [ ] Test socket connection from production URL

### Frontend Hosting

- **Recommended:** Vercel or Netlify
- **Cost:** Free (generous free tier)
- **Setup:**
  - Connect GitHub repo
  - Set environment variable: `VITE_BACKEND_URL`
  - Auto-deploy on push
- **Update:** [apps/web/src/lib/socket.ts](apps/web/src/lib/socket.ts) to read env var
- **Checklist:**
  - [ ] Connect GitHub to Vercel/Netlify
  - [ ] Set backend URL env var
  - [ ] Deploy frontend
  - [ ] Verify Socket.IO works
  - [ ] Test full game flow

### Domain & SSL

- **Purchase domain:** ~$10-15/year (Namecheap, Route53, Cloudflare)
- **DNS setup:** Point to hosting provider
- **SSL:** Automatic (free Let's Encrypt, auto-renewed)
- **Checklist:**
  - [ ] Buy domain
  - [ ] Configure DNS
  - [ ] Test HTTPS connection
  - [ ] Confirm WSS works

### Production Readiness

- [ ] Error tracking enabled (Sentry free tier)
- [ ] Backend logging configured
- [ ] CORS whitelist set correctly
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Room codes work across regions
- [ ] No hardcoded localhost URLs

---

## Phase 2: Mobile Web Browser Optimization

### Timeline: 1 week

### Responsive Layout

**Breakpoints:**

- **Mobile:** < 640px (phones: 360-412px)
- **Tablet portrait:** 640px - 1024px
- **Tablet landscape:** 1024px - 1280px
- **Desktop:** > 1280px

**Changes:**

- Mobile: Stack panels vertically (portrait mode)
- Tablet: Responsive side-by-side layout
- Tighter spacing/padding on mobile
- Font scaling for readability
- Buttons: Min 44px height (Apple guideline)

**Files to update:**

- [apps/web/src/pages/PlayerPage.tsx](apps/web/src/pages/PlayerPage.tsx)
- [apps/web/src/pages/HostPage.tsx](apps/web/src/pages/HostPage.tsx)
- Game panels (VotingPanel, MayhemPhasePanel, etc.)

### Canvas Scaling (Phaser - if graphics added)

```typescript
const config = {
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    orientation: Phaser.Scale.Orientation.PORTRAIT,
    width: window.innerWidth,
    height: window.innerHeight * 0.6,
  },
};
```

- Auto-scales to device width/height
- Supports portrait and landscape
- Safe area awareness (notches, dynamic island, home bar)

### Touch Controls

- Tap detection (buttons, card selection, avatars)
- Swipe support (optional, low priority)
- Disable context menu (right-click not needed)

### Performance

- Pause animations when tab loses focus (battery savings)
- Lazy-load character avatars
- Unload off-screen graphics
- Batch socket updates

### Testing

**Devices:**

- iPhone 11, 12, 13, SE
- iPad
- Android phones (Pixel, Samsung)
- Android tablets

**Test checklist:**

- [ ] Portrait orientation
- [ ] Landscape orientation
- [ ] Network throttling (4G simulation)
- [ ] Touch interactions
- [ ] Notch handling
- [ ] Safe area (dynamic island)
- [ ] Browser compatibility (iOS Safari 14+, Chrome Android 90+)

### Implementation Checklist

- [ ] Add responsive CSS/variables
- [ ] Update components for mobile
- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Verify notch handling
- [ ] Performance test on slow network

---

## Phase 3: 2D Graphics & Visual Polish (Next Priority)

### 2D Graphics Engine Integration

- **Tool:** Phaser 3 or Pixijs
- **Features:**
  - Avatar rendering for each character
  - Character swap animations (slide/transition effects)
  - Role reveal animations (flip, glow, highlight effects)
  - Mayhem phase action animations (power activation feedback)
  - Voting phase idle animations (breathing, subtle movement)
  - Connection state indicators
- **Asset Requirements:**
  - Avatar sprites per character (~2-10 images depending on game)
  - Sprite sheets for animations (optional but recommended)
  - UI particle effects (optional: confetti, sparkles, etc.)
- **Timeline:** 2-3 weeks (1 week integration, 1-2 weeks asset creation/polish)

### Color Theme System ✅

- Centralized color constants for easy theme switching
- Support for light/dark themes in future
- **Status:** Already implemented in `apps/web/src/constants/colors.ts`

---

## Phase 2: Database & Persistence

### PostgreSQL Implementation

- **What to store:**
  - Player accounts (username, email, password hash)
  - Game history (game ID, players, roles assigned, results, duration)
  - Player statistics (win/loss ratio, games played, favorite roles)
  - Character definitions (move from CSV to DB)
  - Room state snapshots (for crash recovery)
  - Chat/log entries (optional)

### Migration Path

1. Set up **PostgreSQL** database (managed service like AWS RDS or Railway)
2. Create schema for accounts, games, statistics
3. Refactor [apps/server/src/state/rooms.ts](apps/server/src/state/rooms.ts) to query DB
4. Add authentication middleware (JWT or similar)
5. Implement player profile pages

### Recommended Services

- **Database:** PostgreSQL on AWS RDS, Railway, or DigitalOcean ($10-50/mo)
- **Migration tool:** Prisma ORM (easy TypeScript integration)
- **Timeline:** 3-4 weeks (schema design, ORM setup, refactoring)

---

## Phase 3: Production Deployment

### Backend Hosting

- **Recommended:** Railway, Render, or DigitalOcean
- **Cost:** $10-30/mo for decent uptime/performance
- **Setup:** Dockerize Node.js server, configure auto-scaling
- **SSL:** Automatic via Let's Encrypt
- **Environment variables:** API URLs, DB connection strings, API keys

### Frontend Hosting

- **Recommended:** Vercel or Netlify (free tier available)
- **Cost:** Free (with paid options for high traffic)
- **Auto-deploy:** On git push
- **CDN:** Automatic global distribution

### Socket.IO Production Config

- Enable Redis adapter for horizontal scaling (when needed)
- CORS properly configured for production domain
- Rate limiting to prevent abuse
- Connection pooling for DB queries

### Domain & SSL

- Purchase domain (~$10-15/year)
- SSL certificate (free via Let's Encrypt, auto-renewed)
- DNS configuration
- **Timeline:** 1-2 days

---

## Phase 4: Advanced Game Features

### Authentication & Accounts

- Player registration/login
- Profile pages with stats and achievement badges
- Password reset flow
- Email verification (optional)
- Social login (Google, Discord) - optional but nice

### Leaderboards & Statistics

- Global leaderboard (win percentage, games played)
- Role-specific stats (best roles, win rates per role)
- Seasonal rankings (reset monthly/quarterly)
- Personal game history with replay data

### In-Game Features

- **Chat system:** In-game and lobby chat
- **Spectator mode:** Allow players to watch after elimination
- **Game settings:** Difficulty levels, custom rule sets
- **Emotes/reactions:** Quick communication during gameplay
- **Elo/rating system:** Skill-based matchmaking (optional)

### Power System Expansion

- All power types fully implemented (Protect, Block, Swap, Initiative)
- Power cooldowns or limited uses per game
- Combo detection (synergies between powers)
- Power preview tooltips in UI

---

## Phase 5: Mobile & Desktop Distribution

### Web Responsiveness ✅ (Priority)

- Mobile-friendly UI layouts
- Touch-optimized controls
- Responsive canvas for graphics
- Testing on iOS Safari, Chrome Android

### Desktop App (Electron)

- Package React + Node backend for Windows/Mac/Linux
- Desktop-specific features: native notifications, push-to-talk voice chat
- Auto-updates
- Estimated effort: 1-2 weeks

### Mobile Apps (Capacitor or React Native)

- iOS and Android native wrappers around web code
- Native notifications, offline queue (future)
- App Store & Play Store distribution
- Estimated effort: 2-3 weeks

### Console Ports (Future consideration)

- **PlayStation/Xbox/Switch:** Requires full engine rewrite (not recommended unless massive success)
- Only consider after 10k+ active users

---

## Phase 6: Monetization & Cosmetics System

### Timeline: 2-3 weeks (backend) + asset creation

### Cosmetics (NO BATTLE PASS, EVER ✅)

**Premium Themes** ($2-5 per theme)

- Base theme: Free to all players
- Premium themes: Unlock via purchase
- Theme variants: Multiple styles of same theme (e.g., "Dark Detective", "Neon Detective")
- Seasonal themes: Limited-time cosmetics (creates FOMO without predatory tactics)

**Username Customization** ($0.99-1.99 per item)

- Custom username colors
- Player taglines/bios
- Badges and decorative elements
- Premium name tags/frames

**Cosmetic Bundles** ($4.99-9.99 each)

- **Starter bundle:** 3 themes + 1 emote pack (content TBD)
- **Deluxe bundle:** 6 themes + username color + badge (content TBD)
- **Seasonal bundle:** Limited-time cosmetics at discount
- Content varies by season (TBD in design phase)

**Seasonal Limited Cosmetics**

- New theme every season (3 months)
- Exclusive cosmetics only available during season
- Non-expiring (players keep after season ends)
- Creates urgency/FOMO without being predatory

### What's NOT monetized (Free-to-play always)

- ❌ Gameplay advantages
- ❌ Character abilities or powers
- ❌ Role selections
- ❌ Win conditions
- ❌ Game rounds or access

### Payment Integration

- Stripe for web payments
- Secure checkout
- Transaction history in player profile
- Regional pricing (optional)

### Implementation Checklist

- [ ] Design cosmetics shop UI
- [ ] Integrate Stripe payment processor
- [ ] Add cosmetics inventory to database
- [ ] Create cosmetics API endpoints
- [ ] Implement theme switching
- [ ] Create seasonal cosmetics update process

---

## Phase 7: Leaderboards & Social Features

### Timeline: 2-3 weeks

### Leaderboards

- Global leaderboard (win percentage, games played)
- Role-specific leaderboards (best win rate as Detective, etc.)
- Weekly/monthly seasons (reset periodically)
- Personal game history with details

### Social Features

- Player profiles with stats and cosmetics showcase
- Friend list (optional: add later)
- Achievement badges (optional: "First win", "100 games", etc.)
- Game history & replay (optional: show moves step-by-step)

---

## Phase 8: Chat System

### Timeline: 2-3 weeks

### Text Chat (First priority)

- Lobby chat (before game starts)
- In-game chat (during game, role-aware visibility)
- Post-game chat (after results)
- Moderation (mute, report)
- Message history (optional)

### Voice Chat (Optional, later addition)

- Optional voice channels during gameplay
- Third-party service: Agora, Daily.co, or Twilio
- Cost: ~$0.50-2.00 per user/month
- Requires WebRTC (supported natively on modern browsers)
- Spatial audio (optional)

### Implementation

- Socket.IO for text chat (reuse existing connection)
- Third-party SDK for voice (if added)
- Rate limiting to prevent spam
- Moderation tools

---

## Phase 9: Database & Persistence

### Timeline: 3-4 weeks

### PostgreSQL Schema

**What to store:**

- Player accounts (username, email, password hash)
- Player profiles (bio, tagline, color, badges)
- Game history (game_id, players, roles, results, duration)
- Player statistics (total games, wins by role)
- Cosmetics inventory (themes, skins, badges owned)
- Character definitions (move from CSV to DB)
- Chat/logs (optional)

### Setup Process

1. Create PostgreSQL instance
2. Design schema with Prisma
3. Run migrations
4. Refactor [apps/server/src/state/rooms.ts](apps/server/src/state/rooms.ts)
5. Add JWT authentication
6. Test backup/recovery

### Recommended Services

- **Database:** Railway, Render, AWS RDS, or DigitalOcean
- **Cost:** $10-50/mo
- **ORM:** Prisma

---

## Phase 10: Authentication & Accounts

### Timeline: 2-3 weeks

### Features

- Player registration/login
- Profile pages (stats, cosmetics, badges)
- Password reset (email verification)
- Username + tagline + color customization
- Account settings (notification preferences)
- Social login (Google, Discord) - optional

### Implementation

- Add registration/login pages
- JWT authentication on socket events
- Player profile API endpoints
- Email verification

---

## Phase 11: Scaling & Infrastructure

### When to implement: At 1000+ concurrent players

### Horizontal Scaling

- Multiple backend instances
- Redis for session storage and socket adapter
- Load balancer
- Sticky sessions for Socket.IO

### Monitoring

- Error tracking (Sentry)
- Performance monitoring
- Log aggregation
- Uptime monitoring

### Cost at Scale

- MVP (100 users/day): $20-50/mo
- Growth (10k users/day): $200-500/mo
- Scale (100k+ users/day): $1000+/mo

---

## Technical Debt & Maintenance

### Code Quality

- [ ] Add unit tests (80% coverage target)
- [ ] Add integration tests (Socket.IO events)
- [ ] Add E2E tests (full game flow)
- [ ] Refactor large components
- [ ] Document socket events

### Security Checklist

- [ ] Input validation on socket events
- [ ] Rate limiting enabled
- [ ] CORS whitelist correct
- [ ] XSS protection (React handles this)
- [ ] SQL injection prevention (Prisma)
- [ ] HTTPS/WSS enforced
- [ ] DDoS mitigation (cloud provider)
- [ ] Regular security audits

### Performance Targets

- Socket event latency: < 100ms
- Page load time: < 2s
- Animation FPS: 60 fps (or 30 on low-end)
- Bundle size: < 500KB (gzipped)
- Database query time: < 100ms

---

## Game Scaling Parameters

| Game         | Min Players | Max Players | Reason                                |
| ------------ | ----------- | ----------- | ------------------------------------- |
| Infiltration | 3           | 8           | Social deduction needs intimate group |
| Odd One Out  | 3           | 12          | More scalable, simpler roles          |

---

## Monetization Summary

### Free-to-Play Base Game ✅

- Full access to all games
- All core gameplay
- No ads
- No pay-to-win

### Revenue Streams (NO BATTLE PASS)

1. **Premium Themes:** $2-5 per theme
2. **Username Customization:** $0.99-1.99 per item
3. **Cosmetic Bundles:** $4.99-9.99 (content TBD)
4. **Seasonal Limited Cosmetics:** Creates recurring revenue
5. **Optional:** Premium membership (exclusive cosmetics, future)

### Philosophy

- All purchases cosmetic only
- No gameplay advantages
- No mandatory spending
- Seasonal cosmetics create FOMO without predatory tactics
- Transparent pricing

---

## Immediate Action Items (This Week)

1. **Production Deployment** (Day 1-2)
   - Deploy backend to Railway/Render
   - Deploy frontend to Vercel/Netlify
   - Verify end-to-end on production

2. **Mobile Web** (Day 3-7)
   - Add responsive layout
   - Test on iPhone and Android
   - Verify safe area handling

---

## Resources & Tools

### Services

- **Hosting:** Railway, Render, DigitalOcean
- **Frontend:** Vercel, Netlify
- **Database:** PostgreSQL on managed service
- **Payments:** Stripe
- **Error tracking:** Sentry (free tier)
- **Graphics:** Phaser 3 (free, open-source)
- **ORM:** Prisma

### Learning Resources

- Phaser 3: https://photonstorm.github.io/phaser3-docs/
- Socket.IO Production: https://socket.io/docs/v4/production/
- Prisma: https://www.prisma.io/docs/
- Railway: https://railway.app/docs
- Vercel: https://vercel.com/docs

---

## Open Questions / Design Decisions

- [ ] Avatar art style: TBD
- [ ] Cosmetic bundle contents: TBD
- [ ] Voice chat: Include at launch or later?
- [ ] Spectator mode: Yes or no?
- [ ] Friend list: Launch or later?
- [ ] Mobile app wrapping: When to start?

---

_Last updated: Feb 27, 2026_
_This is a living document. Review quarterly or when priorities change._
