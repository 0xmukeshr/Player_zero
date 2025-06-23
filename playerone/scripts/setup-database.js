#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase configuration.');
  console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database for Player Zero game...');

  console.log('\n⚠️  Automatic schema setup not supported by Supabase client.');
  console.log('\n📋 Please follow these manual setup steps:');
  
  console.log('\n1. 🌐 Go to your Supabase dashboard:');
  console.log('   https://supabase.com/dashboard/projects');
  
  console.log('\n2. 📊 Open SQL Editor:');
  console.log('   - Click on your project');
  console.log('   - Navigate to "SQL Editor" in the sidebar');
  console.log('   - Click "New Query"');
  
  console.log('\n3. 📄 Copy and paste this SQL:');
  console.log('   - Open: database/schema.sql');
  console.log('   - Copy ALL contents');
  console.log('   - Paste into SQL Editor');
  console.log('   - Click "Run" button');
  
  console.log('\n4. ✅ Verify setup:');
  console.log('   - Go to "Table Editor"');
  console.log('   - You should see "games" table');
  
  console.log('\n5. 🧪 Test the connection:');
  console.log('   - Run this script again with --test flag');
  console.log('   - Or start your server with: npm run dev');
  
  // Test connection only
  try {
    console.log('\n🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('games').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('relation "games" does not exist')) {
        console.log('⚠️  Games table not found - please run the SQL setup first');
      } else {
        console.error('❌ Connection error:', error.message);
      }
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('📊 Games table found');
      
      // Test insert if table exists
      await testDatabaseOperations();
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

async function testDatabaseOperations() {
  console.log('\n🧪 Testing database operations...');
  
  const testGame = {
    game_name: 'Test Game',
    game_id: 'TEST' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    status: 'waiting',
    visibility: 'public',
    players: [
      {
        id: 'player_test',
        name: 'TestPlayer',
        tokens: 1000,
        assets: { gold: 50, water: 25, oil: 10 }
      }
    ],
    game_state: {
      currentRound: 1,
      maxRounds: 20,
      timeRemaining: { hours: 0, minutes: 1, seconds: 0 }
    },
    host_player_id: 'player_test',
    current_players: 1,
    max_players: 4
  };

  try {
    // Test insert
    const { data: insertData, error: insertError } = await supabase
      .from('games')
      .insert([testGame])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating test game:', insertError.message);
      return;
    }

    console.log('✅ Test game created successfully!');
    
    // Test public_games view
    const { data: publicGames, error: viewError } = await supabase
      .from('public_games')
      .select('*')
      .limit(5);

    if (viewError) {
      console.error('❌ Error querying public games view:', viewError.message);
    } else {
      console.log('✅ Public games view working!');
      console.log('📊 Found', publicGames.length, 'public games');
    }

    // Clean up test data
    await supabase.from('games').delete().eq('game_id', testGame.game_id);
    console.log('🧹 Test data cleaned up');
    
    console.log('\n🎉 Database is working perfectly!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Create a game and see it in Supabase!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

// Alternative manual setup instructions
function showManualSetup() {
  console.log('\n📖 Manual Setup Instructions:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the contents of database/schema.sql');
  console.log('4. Run the SQL script');
  console.log('5. Update your .env file with Supabase credentials');
}

if (process.argv.includes('--manual')) {
  showManualSetup();
} else {
  setupDatabase().catch(console.error);
}

