import React, { useState, useEffect } from 'react';
import { User, Trophy, Target, Clock, Edit3, Save, X, RefreshCw, Dice6, Trash2 } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

export function ProfilePage() {
  const { playSound } = useAudio();
  const [userProfile, setUserProfile] = useState<{ name: string; wallet: string; avatar: string; createdAt?: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', avatar: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Avatar options for editing
  const avatarEmojis = [
    '🤖', '👾', '🎮', '⚡', '🔥', '💎', '🌟', '🚀', '🛡️', '⚔️',
    '👑', '🎯', '🎲', '🔮', '💫', '🌈', '🎨', '🎭', '🎪', '🎊',
    '🐉', '🦄', '👻', '💀', '🎃', '🌙', '☄️', '🌊', '🔱', '⚡'
  ];
  
  // Generate random name function
  const generateRandomName = () => {
    const prefixes = [
      'Pixel', 'Crypto', 'Byte', 'Zero', 'Neon', 'Cyber', 'Quantum', 'Matrix',
      'Digital', 'Binary', 'Hex', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Omega',
      'Shadow', 'Ghost', 'Phoenix', 'Nova', 'Vortex', 'Nexus', 'Echo', 'Flux'
    ];
    const suffixes = [
      'Player', 'Master', 'Hunter', 'Warrior', 'Guardian', 'Knight', 'Sage',
      'Wizard', 'Hacker', 'Trader', 'Rebel', 'Hero', 'Legend', 'Champion',
      'Fighter', 'Slayer', 'Ninja', 'Samurai', 'Pilot', 'Ranger', 'Scout'
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${prefix}${suffix}${number}`;
  };
  
  const stats = [
    { label: 'Games', value: '0', icon: Target, color: 'text-pixel-success', bgColor: 'bg-pixel-success', borderColor: 'border-pixel-success' },
    { label: 'Wins', value: '0', icon: Trophy, color: 'text-pixel-yellow', bgColor: 'bg-pixel-yellow', borderColor: 'border-pixel-yellow' },
    { label: 'Win Rate', value: '0%', icon: Target, color: 'text-pixel-blue', bgColor: 'bg-pixel-blue', borderColor: 'border-pixel-blue' },
    { label: 'Hours', value: '0h', icon: Clock, color: 'text-pixel-magenta', bgColor: 'bg-pixel-magenta', borderColor: 'border-pixel-magenta' }
  ];

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = () => {
      const existingProfile = localStorage.getItem('userProfile');
      if (existingProfile) {
        try {
          const profile = JSON.parse(existingProfile);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };
    
    loadProfile();
    
    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadProfile();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);
  
  const handleEditProfile = () => {
    if (userProfile) {
      setEditData({
        name: userProfile.name,
        avatar: userProfile.avatar
      });
      setIsEditing(true);
      playSound('click');
    }
  };
  
  const handleSaveProfile = () => {
    if (userProfile && editData.name.trim()) {
      const updatedProfile = {
        ...userProfile,
        name: editData.name.trim(),
        avatar: editData.avatar
      };
      
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile);
      setIsEditing(false);
      playSound('switch');
      
      // Notify other parts of the app
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    }
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({ name: '', avatar: '' });
    playSound('click');
  };
  
  const handleDeleteProfile = () => {
    localStorage.removeItem('userProfile');
    setUserProfile(null);
    setShowDeleteConfirm(false);
    playSound('switch');
    
    // Notify other parts of the app
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  };
  
  const handleGenerateRandomName = () => {
    const newName = generateRandomName();
    setEditData(prev => ({ ...prev, name: newName }));
    playSound('click');
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };
  
  const recentGames = [
    // Placeholder data - in a real app this would come from game history
    { name: 'No games played yet', result: 'Start playing!', date: '' }
  ];

  const achievements = [
    { name: 'Profile Created', icon: User, unlocked: !!userProfile },
    { name: 'First Game', icon: Target, unlocked: false },
    { name: 'First Victory', icon: Trophy, unlocked: false },
    { name: 'Master Trader', icon: Clock, unlocked: false }
  ];

  // No profile state
  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="text-center">
          <h1 className="text-pixel-2xl font-bold text-pixel-primary mb-6 uppercase tracking-wider">
            No Profile Found
          </h1>
          <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-10">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-pixel-base-gray text-pixel-base mb-6">
              You haven't created a profile yet. Create one to start playing!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-pixel-primary hover:bg-pixel-accent text-pixel-black font-bold text-pixel-base pixel-btn border-pixel-black uppercase tracking-wider"
            >
              Create Profile
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <h1 className="text-pixel-2xl font-bold text-pixel-primary mb-6 uppercase tracking-wider text-center">
        Player Profile
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-6">
            {!isEditing ? (
              <>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-pixel-accent pixel-avatar mx-auto mb-3 flex items-center justify-center text-3xl">
                    {userProfile.avatar}
                  </div>
                  <h2 className="text-pixel-lg font-bold text-pixel-primary mb-1 uppercase tracking-wider">
                    {userProfile.name}
                  </h2>
                  <p className="text-pixel-accent font-bold text-pixel-sm uppercase">Player Zero</p>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleEditProfile}
                      className="flex-1 px-3 py-2 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black uppercase tracking-wider flex items-center justify-center space-x-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        playSound('click');
                        setShowDeleteConfirm(true);
                      }}
                      className="px-3 py-2 bg-pixel-error hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="pixel-card bg-pixel-gray border-pixel-light-gray p-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-pixel-primary" />
                      <span className="text-pixel-xs text-pixel-light-gray font-bold uppercase">
                        Joined {formatDate(userProfile.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pixel-card bg-pixel-gray border-pixel-light-gray p-3">
                    <div className="text-pixel-xs text-pixel-light-gray font-bold uppercase mb-1">Wallet Address</div>
                    <div className="text-pixel-accent font-mono text-pixel-xs break-all">
                      {userProfile.wallet.substring(0, 10)}...{userProfile.wallet.substring(userProfile.wallet.length - 6)}
                    </div>
                  </div>
                  
                  <div className="pixel-card bg-pixel-gray border-pixel-primary p-3">
                    <div className="text-pixel-xs text-pixel-light-gray font-bold uppercase mb-1">Current Rank</div>
                    <div className="text-pixel-accent font-bold text-pixel-base uppercase tracking-wider">Beginner</div>
                  </div>
                  
                  <div className="pixel-card bg-pixel-gray border-pixel-secondary p-3">
                    <div className="text-pixel-xs text-pixel-light-gray font-bold uppercase mb-1">Total Points</div>
                    <div className="text-pixel-secondary font-bold text-pixel-base">0</div>
                  </div>
                </div>
              </>
            ) : (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-pixel-base font-bold text-pixel-primary uppercase tracking-wider mb-4">
                    Edit Profile
                  </h3>
                </div>
                
                {/* Avatar Selection */}
                <div>
                  <label className="block text-pixel-xs font-bold text-pixel-primary mb-2 uppercase">Avatar</label>
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {avatarEmojis.slice(0, 12).map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setEditData(prev => ({ ...prev, avatar: emoji }));
                          playSound('click');
                        }}
                        className={`w-8 h-8 pixel-btn flex items-center justify-center text-lg ${
                          editData.avatar === emoji
                            ? 'bg-pixel-accent text-pixel-black border-pixel-black'
                            : 'bg-pixel-gray hover:bg-pixel-light-gray border-pixel-light-gray'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="text-2xl">{editData.avatar}</div>
                    <button
                      onClick={() => {
                        const randomAvatar = avatarEmojis[Math.floor(Math.random() * avatarEmojis.length)];
                        setEditData(prev => ({ ...prev, avatar: randomAvatar }));
                        playSound('click');
                      }}
                      className="px-2 py-1 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black uppercase"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* Name Editing */}
                <div>
                  <label className="block text-pixel-xs font-bold text-pixel-primary mb-2 uppercase">Name</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      maxLength={20}
                      className="flex-1 px-3 py-2 bg-pixel-gray pixel-input border-pixel-light-gray text-pixel-primary text-pixel-sm font-bold focus:outline-none focus:border-pixel-accent"
                    />
                    <button
                      onClick={handleGenerateRandomName}
                      className="px-3 py-2 bg-pixel-secondary hover:bg-pixel-warning text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black"
                    >
                      <Dice6 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={!editData.name.trim()}
                    className="flex-1 px-3 py-2 bg-pixel-success hover:bg-pixel-primary text-pixel-black font-bold text-pixel-xs pixel-btn border-pixel-black uppercase tracking-wider flex items-center justify-center space-x-1 disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-3 py-2 bg-pixel-gray hover:bg-pixel-light-gray text-pixel-primary font-bold text-pixel-xs pixel-btn border-pixel-light-gray uppercase tracking-wider flex items-center justify-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats and Recent Games */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className={`bg-pixel-gray pixel-card ${stat.borderColor} p-4`}>
                <div className={`flex items-center justify-center w-8 h-8 ${stat.bgColor} pixel-avatar mb-2`}>
                  <stat.icon className="w-4 h-4 text-pixel-black" />
                </div>
                <div className={`text-pixel-lg font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-pixel-xs text-pixel-primary font-bold uppercase">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Recent Games */}
          <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray">
            <div className="px-6 py-4 border-b-2 border-pixel-gray">
              <h3 className="text-pixel-base font-bold text-pixel-primary uppercase tracking-wider text-center">Recent Games</h3>
            </div>
            <div className="p-4 space-y-3">
              {recentGames.map((game, index) => (
                <div key={index} className="pixel-card bg-pixel-gray border-pixel-light-gray p-3 hover:bg-pixel-light-gray transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-pixel-primary font-bold text-pixel-sm">
                        {game.name.length > 20 ? game.name.substring(0, 17) + '...' : game.name}
                      </div>
                      <div className="text-pixel-xs text-pixel-light-gray font-bold">{game.date}</div>
                    </div>
                    <div>
                      <span className={`px-2 py-1 pixel-notification text-pixel-xs font-bold uppercase tracking-wider ${
                        game.result === 'Victory' 
                          ? 'bg-pixel-success text-pixel-black border-pixel-black' 
                          : 'bg-pixel-error text-pixel-black border-pixel-black'
                      }`}>
                        {game.result}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Achievements */}
          <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray">
            <div className="px-6 py-4 border-b-2 border-pixel-gray">
              <h3 className="text-pixel-base font-bold text-pixel-primary uppercase tracking-wider text-center">Achievements</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className={`pixel-card p-2 ${
                    achievement.unlocked 
                      ? 'bg-pixel-gray border-pixel-accent' 
                      : 'bg-pixel-dark-gray border-pixel-light-gray'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 pixel-avatar flex items-center justify-center ${
                        achievement.unlocked 
                          ? 'bg-pixel-accent' 
                          : 'bg-pixel-light-gray'
                      }`}>
                        <achievement.icon className="w-3 h-3 text-pixel-black" />
                      </div>
                      <div>
                        <div className={`text-pixel-xs font-bold uppercase ${
                          achievement.unlocked 
                            ? 'text-pixel-accent' 
                            : 'text-pixel-light-gray'
                        }`}>
                          {achievement.name}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4">
          <div className="bg-pixel-error p-8 sm:p-10 pixel-panel border-pixel-error max-w-lg w-full mx-4">
            <h3 className="text-pixel-xl font-bold text-pixel-black text-center mb-6 uppercase tracking-wider">
              Delete Profile?
            </h3>
            
            <div className="bg-pixel-black p-4 pixel-panel border-pixel-error mb-6">
              <p className="text-pixel-error text-pixel-sm font-bold text-center mb-4">
                This will permanently delete your profile!
              </p>
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="text-2xl">{userProfile.avatar}</div>
                <div>
                  <div className="text-pixel-accent font-bold text-pixel-sm">{userProfile.name}</div>
                  <div className="text-pixel-light-gray font-mono text-pixel-xs">
                    {userProfile.wallet.substring(0, 10)}...{userProfile.wallet.substring(userProfile.wallet.length - 6)}
                  </div>
                </div>
              </div>
              <p className="text-pixel-light-gray text-pixel-xs text-center">
                You'll need to create a new profile to play games.
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  playSound('click');
                  handleDeleteProfile();
                }}
                className="flex-1 px-6 py-3 bg-pixel-black hover:bg-pixel-dark-gray text-pixel-error font-bold text-pixel-base pixel-btn border-pixel-error uppercase tracking-wider"
              >
                Delete Forever
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-6 py-3 bg-pixel-dark-gray hover:bg-pixel-gray text-pixel-light-gray font-bold text-pixel-base pixel-btn border-pixel-gray uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
