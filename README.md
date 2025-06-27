# 🎮 Player Zero - Strategic Multiplayer Trading Game

[![Starknet](https://img.shields.io/badge/Starknet-Ready-orange)](https://starknet.io) [![Cairo](https://img.shields.io/badge/Cairo-2.0-blue)](https://cairo-lang.org) [![Dojo](https://img.shields.io/badge/Dojo-ECS-red)](https://dojoengine.org) [![Cartridge](https://img.shields.io/badge/Cartridge-Controller-purple)](https://cartridge.gg)

> A fully on-chain multiplayer strategy game built on Starknet where players trade resources, make strategic decisions, and compete for dominance in a dynamic market environment. All game actions are executed on-chain with real token rewards.

## Play Ready
https://player-zero-final-1pot.vercel.app/
## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Git
- Supabase account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/0xmukeshr/Player_zero.git
   cd Player_zero/
   ```

2. **Navigate to the game directory**
   ```bash
   cd player_zero
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure Supabase Database**
   - Create a new project at [Supabase](https://supabase.com)
   - Go to Settings → API to get your project URL and keys
   - Copy the environment variables:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` file with your Supabase credentials:
     ```bash
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

5. **Set up the database schema**
   - Open Supabase SQL Editor
   - Copy and paste the contents of `database/schema.sql`
   - Run the SQL to create tables and set up the database

6. **Start the game**
   ```bash
   npm run dev
   ```


## 🎯 Game Overview

**Player Zero** is a strategic multiplayer trading game where players compete in real-time to accumulate the most wealth through smart resource trading, strategic timing, and tactical decisions.

### Core Gameplay Loop

1. **🔗 Connect Starknet Wallet** - Connect via Cartridge Controller with auto-generated cool username
2. **🎯 Join Waitlist** - Get unique game ID and join the competitive waitlist
3. **🎮 On-Chain Game Entry** - Enter games with real Starknet transactions
4. **📊 Strategic Trading** - Execute on-chain trades for Gold, Water, Oil resources
5. **⚔️ Tactical Actions** - All sabotage and market actions recorded on blockchain
6. **🏆 Winner Takes All** - At round 20, assets auto-sell and winner receives entire token pool

## 🎮 Game Features

### 🎭 Starknet Identity System
- **Cartridge Controller**: Seamless Starknet wallet connection
- **Cool Username Generation**: Auto-generated swag names tied to wallet address
- **Blockchain Identity**: Your Starknet address is your permanent game identity
- **Waitlist System**: Unique game IDs for competitive entry

### 🏢 Game Lobby
- **Create Games**: Host public or private games with custom names
- **Join Games**: Browse public games or join with game ID
- **Real-time Updates**: Live player count and game status
- **Host Controls**: Game creators can start games when ready

### 💰 On-Chain Trading System
- **Three Resources**: Gold (premium), Water (utility), Oil (volatile)
- **Blockchain Transactions**: Every trade is a real Starknet transaction
- **Player-Driven Market**: Prices fluctuate based on collective player actions from previous rounds
- **Action-Based Price Changes**: Market adjusts according to buy/sell/burn activities of all players
- **Verifiable Trading**: All actions permanently recorded on blockchain

### ⚔️ On-Chain Combat & Strategy
- **Smart Contract Sabotage**: Disrupt opponents through blockchain transactions
- **Decentralized Market**: Price manipulation through on-chain coordination
- **Transparent Resource Management**: All portfolios visible on blockchain
- **Timed Rounds**: 20 rounds of strategic blockchain gameplay

### 🕒 Round System
- **20 Rounds Maximum**: Each game has up to 20 strategic rounds
- **60-Second Turns**: Players have 1 minute to make decisions
- **Real-time Updates**: Live action feed and market changes
- **Auto-progression**: Rounds advance automatically

## 🎯 Game Mechanics

### 💎 Starting Resources
Each player begins with:
- **1000 Tokens** (currency for trading)
- **0 old** (high-value, stable resource)
- **0 Water** (utility resource, moderate volatility)
- **0 Oil** (high-risk, high-reward resource)

### Trading Actions

| Action | Description | Strategic Use | Market Impact |
|--------|-------------|---------------|---------------|
| **🛒 Buy** | Purchase resources at current market price | Accumulate before price increases | Increases demand, drives up prices in next round |
| **💸 Sell** | Convert resources to tokens | Lock in profits, free up capital | Increases supply, lowers prices in next round |
| **🔥 Burn** | Destroy resources permanently | Reduce supply to increase future prices | Decreases total supply, raises prices in next round |
| **⚔️ Sabotage** | Target opponent resources | Disrupt competitor strategies | Affects opponent's ability to influence market |

### 📊 Market Dynamics
- **Player Action Impact**: Resource prices adjust based on collective player behavior from previous rounds
- **Supply & Demand**: Buy actions increase demand, sell actions increase supply, burn actions reduce supply
- **Round-to-Round Changes**: Each new round reflects market changes from all previous player actions
- **Price Volatility**: Each resource responds differently to player trading patterns
- **Strategic Timing**: Understanding how past actions affect future prices is key to success

### 🏆 Winner-Takes-All Victory
At the end of 20 rounds, the game automatically:
1. **Auto-Sell All Assets**: Smart contract liquidates all player resources
2. **Calculate Final Values**: Token totals determine the winner
3. **Transfer Prize Pool**: Winner receives all tokens from the collective pool
4. **On-Chain Verification**: Victory and rewards permanently recorded on Starknet

**Prize Mechanics**:
- All player entry fees and traded tokens form the prize pool
- Winner gets 100% of the total token pool
- Transactions are final and verifiable on blockchain

## 🛠️ Technical Architecture

### Frontend Stack
```
🎨 React 18.3.1          - Modern UI framework
⚡ Vite                  - Fast development build tool
🎭 TypeScript            - Type-safe development
🎨 Tailwind CSS          - Utility-first styling
🔄 Socket.io Client      - Real-time communication
🎵 Web Audio API         - Game sounds and music
🔗 Cartridge Controller  - Starknet wallet integration
⚡ Starknet React        - Blockchain state management
💎 Dojo Engine           - On-chain game framework
```

### Blockchain Stack
```
⚡ Starknet              - Layer 2 blockchain for scalable gaming
🎮 Dojo Engine           - On-chain game entity framework
📜 Cairo Smart Contracts - Game logic and state management
🔗 Cartridge Controller  - Seamless wallet UX for gaming
🌐 Torii Client          - Real-time blockchain data indexing
🚀 Node.js + Express     - Off-chain coordination server
🔄 Socket.io             - Real-time game event broadcasting
🗄️ Supabase             - Game metadata and leaderboards
```

### Database Schema
```sql
-- Core game storage
GAMES Table:
- id (UUID): Unique game identifier
- game_name: Display name for the game
- game_id: Short public game ID (ABC123DEF format)
- status: waiting/playing/finished
- visibility: public/private
- players: JSONB array of player data
- game_state: JSONB game state snapshot
- host_player_id: Game creator identifier
- current_players: Real-time player count
- max_players: Game capacity (default 4)
- created_at/updated_at: Timestamps
```

## 🎮 How to Play

### First Time Setup

1. **🔗 Connect Starknet Wallet**
   - Open the game in your browser
   - Click "Connect Wallet" to launch Cartridge Controller
   - Your Starknet address becomes your permanent game identity
   - A cool swag username is auto-generated for your address

2. **🎯 Join Game Waitlist**
   - Receive a unique game ID tied to your wallet
   - Join the competitive waitlist for upcoming games
   - Your position and stats are tracked on-chain

3. **🎮 Enter On-Chain Games**
   - Games are launched when enough players join
   - Entry requires a Starknet transaction (game fee)
   - All subsequent actions are blockchain transactions

### Creating a Game

1. **🎮 Create New Game**
   ```
   ✅ Click "Create Game"
   ✅ Enter a unique game name
   ✅ Choose public (anyone can join) or private (invite-only)
   ✅ Share the game ID with friends for private games
   ✅ Wait for other players to join (2-4 players)
   ✅ Click "Start Game" when ready
   ```

### Joining a Game

1. **🔍 Join Existing Game**
   ```
   ✅ Browse public games in the lobby
   ✅ Click "Join" on any available game
   ✅ OR enter a specific game ID for private games
   ✅ Wait for the host to start the game
   ```

### Playing the Game

1. **📊 Monitor Your On-Chain Status**
   - **Tokens**: Your on-chain token balance for trading
   - **Resources**: Gold, Water, Oil quantities stored on blockchain
   - **Total Value**: Portfolio worth calculated by smart contracts
   - **Rank**: Position based on verified on-chain assets
   - **Transaction History**: All moves permanently recorded

2. **📈 Watch the Market**
   - **Current Prices**: Real-time resource values
   - **Market Changes**: Price movements based on previous round player actions
   - **Action Impact**: See how collective player behavior affects pricing
   - **Trend Analysis**: Study how past rounds influence current market conditions

3. **🎯 Execute On-Chain Strategies**
   - **Buy Resources**: Submit blockchain transactions to purchase assets (increases next round prices)
   - **Sell Resources**: On-chain trades convert resources to tokens (decreases next round prices)
   - **Burn Resources**: Permanently destroy assets via smart contract (reduces supply, raises next round prices)
   - **Sabotage Opponents**: Attack strategies through verified transactions
   - **Market Manipulation**: Coordinate actions to influence next round pricing
   - **Gas Optimization**: Strategic timing considering transaction costs

4. **⏰ Blockchain Timing Strategy**
   - Each round lasts for strategic planning
   - Submit transactions before round ends
   - Monitor blockchain confirmations
   - Track opponent on-chain activities
   - **Round 20 Auto-Liquidation**: All assets automatically sold at game end

### Winning Strategies

1. **💰 Portfolio Diversification**
   - Don't put all tokens in one resource
   - Balance high-risk Oil with stable Gold
   - Keep some tokens liquid for opportunities

2. **📊 Market Analysis & Timing**
   - Study how previous round actions affected current prices
   - Buy when collective selling in past rounds lowered prices
   - Sell when heavy buying in previous rounds inflated values
   - Predict future price movements based on current round activity patterns
   - Time your burns strategically to affect next round pricing

3. **⚔️ Competitive Play**
   - Monitor opponent portfolios
   - Use sabotage strategically
   - Form temporary alliances
   - Disrupt leader strategies

4. **🕒 Endgame Planning**
   - Track remaining rounds
   - Convert to highest-value resources near the end
   - Make final strategic moves in last few rounds

## 🔧 Development Setup

### Local Development

1. **Install dependencies**
   ```bash
   cd player_zero
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Set up database**
   - Create Supabase project
   - Run `database/schema.sql` in SQL Editor
   - Configure Row Level Security (RLS) policies

4. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables

```bash
# Server Configuration
VITE_SERVER_URL=http://localhost:3001

# Starknet Configuration
VITE_PUBLIC_DEPLOY_TYPE=DEPLOY_TYPE
VITE_PUBLIC_NODE_URL=RPC_URL
VITE_PUBLIC_TORII=TORII_URL
VITE_PUBLIC_MASTER_ADDRESS=DEPLOYER_ACCOUNT_ADDRESS
VITE_PUBLIC_MASTER_PRIVATE_KEY=DEPLOYER_PRIVATE_KEY
VITE_PUBLIC_SLOT_ADDRESS=KATANA_ADDRESS

# Supabase Database (for game metadata)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Project Structure

```
playerone/
├── src/
│   ├── components/          # React UI components
│   │   ├── HomePage.tsx     # Landing page
│   │   ├── ProfileCreationPage.tsx  # Wallet connection
│   │   ├── GameLobby.tsx    # Game browser and creation
│   │   ├── GameInterface.tsx # Main game UI
│   │   ├── PlayerStats.tsx  # Player dashboard
│   │   ├── AssetsList.tsx   # Resource management
│   │   └── ActionPanel.tsx  # Game controls
│   ├── context/             # React context providers
│   │   └── SocketContext.tsx # Real-time communication
│   ├── hooks/               # Custom React hooks
│   │   ├── useAudio.ts      # Sound system
│   │   └── useGames.ts      # Game state management
│   ├── services/            # External service integrations
│   │   └── database.js      # Supabase database client
│   └── types/               # TypeScript type definitions
│       └── game.ts          # Game state types
├── database/
│   └── schema.sql           # Database setup script
├── public/                  # Static assets
├── server.js                # Backend server
└── package.json             # Dependencies and scripts
```

## 🎵 Audio & Visual Features

### Sound System
- **Background Music**: Ambient pixel-style soundtrack
- **Action Sounds**: Click, switch, and action feedback
- **Market Events**: Audio cues for price changes
- **Mute Controls**: Toggle music and sound effects

### Visual Design
- **Pixel Art Style**: Retro gaming aesthetic
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live data without page refresh
- **Animation Effects**: Smooth transitions and feedback

## 🔒 Blockchain Security & Transparency

### On-Chain Data Protection
- **Wallet Security**: Cartridge Controller handles private key management
- **Immutable Records**: All game actions permanently stored on blockchain
- **Pseudonymous Gaming**: Wallet addresses provide privacy with transparency

### Decentralized Game Integrity
- **Smart Contract Validation**: All actions validated by blockchain consensus
- **Transparent Anti-cheat**: Game logic open-source and verifiable
- **Blockchain State Sync**: Authoritative state managed by Starknet
- **Automated Payouts**: Winner rewards distributed by smart contract
- **Verifiable Randomness**: Market events use blockchain-based randomness

## 🚀 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Configure production environment**
   ```bash
   # Update .env for production
   VITE_SERVER_URL=https://your-domain.com
   SUPABASE_URL=your_production_supabase_url
   # ... other production settings
   ```

3. **Deploy to hosting platform**
   - Vercel, Netlify, or similar for frontend
   - Railway, Heroku, or VPS for backend
   - Ensure websocket support for Socket.io

### Scaling Considerations
- **Database**: Supabase handles scaling automatically
- **Socket.io**: Use Redis adapter for multiple server instances
- **Memory**: Active game states in Redis for production
- **Monitoring**: Add logging and error tracking

## 🤝 Contributing

### Development Guidelines
1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/new-feature`)
3. **Follow code style** (ESLint + Prettier)
4. **Test your changes** thoroughly
5. **Submit pull request** with detailed description

### Bug Reports
- Use GitHub Issues for bug reports
- Include reproduction steps
- Provide browser/environment details
- Screenshots for UI issues

## 🎉 Game Statistics

### On-Chain Game Settings
- **Max Players**: 4 per game
- **Starting Resources**: 0 Gold, 0 Water, 0 Oil
- **Fixed Rounds**: Exactly 20 rounds per game
- **Auto-Liquidation**: All assets sold automatically at round 20
- **Winner Prize**: 100% of total token pool from all players
- **Game Types**: Waitlist-based competitive games

### Resource Properties
- **Gold**: High value, low volatility, safe investment
- **Water**: Medium value, medium volatility, utility resource
- **Oil**: High volatility, high risk/reward, speculative asset

## 🏆 Game Modes

### Standard Mode (Current)
- **4 Players Maximum**
- **20 Round Limit**
- **All Actions Available**
- **Dynamic Market Events**

### Future Modes (Potential)
- **Quick Game**: 10 rounds, faster pace
- **Tournament**: Elimination brackets
- **Cooperative**: Team-based gameplay
- **AI Opponents**: Practice against bots

## 📞 Support

### Getting Help
- **Documentation**: This README covers most features
- **Issues**: Use GitHub Issues for bugs and feature requests
- **Community**: Join discussions in GitHub Discussions

### Common Issues
1. **Database Connection**: Verify Supabase credentials in `.env`
2. **Socket Connection**: Check server URL configuration
3. **Game Not Starting**: Ensure minimum 2 players
4. **Profile Issues**: Clear localStorage and recreate profile

---

**🎮 Ready to dominate the market? Start your Player Zero journey today!**

*Built with ❤️ using React, Node.js, Socket.io, and Supabase*

