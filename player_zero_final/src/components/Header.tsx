import React, { useState } from 'react';
import { Bell, Sword, User, Menu, X } from "lucide-react";
import { useAudio } from "../hooks/useAudio";
import { useStarknetConnect } from "../dojo/hooks/useStarknetConnect";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const { playSound } = useAudio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { status, address, isConnecting, handleConnect, handleDisconnect } =
    useStarknetConnect();

  const navItems = [
    { id: "home", label: "Home" },
    { id: "games", label: "Games" },
    { id: "profile", label: "Profile" },
  ];

  // Helper function to format address
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleNavClick = (itemId: string) => {
    playSound("rollover");
    onNavigate(itemId);
    setMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const toggleMobileMenu = () => {
    playSound("rollover");
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <header className="bg-pixel-dark-gray pixel-panel border-pixel-gray border-b-2 px-3 sm:px-6 py-3 relative z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-pixel-primary pixel-avatar">
              <Sword className="w-4 h-4 sm:w-5 sm:h-5 text-pixel-black" />
            </div>
            <h1 className="text-pixel-sm sm:text-pixel-base font-bold text-pixel-primary uppercase tracking-wide">
              <span className="xs:inline">Player Zero</span>
              {/* <span className="xs:hidden">PZ</span> */}
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-2 pixel-nav-item text-pixel-sm font-bold uppercase tracking-wide min-h-touch ${
                  currentPage === item.id
                    ? "bg-pixel-primary text-pixel-black active"
                    : "text-pixel-primary hover:text-pixel-black hover:bg-pixel-primary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notifications - Hidden on mobile */}
            <div className="relative hidden sm:block">
              <div className="pixel-notification bg-pixel-secondary border-pixel-black w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-pixel-warning transition-colors">
                <Bell className="w-4 h-4 text-pixel-black" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pixel-error pixel-avatar"></div>
            </div>

            {/* Wallet Connection Status */}
            {isConnecting ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pixel-gray pixel-avatar flex items-center justify-center animate-pulse">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-pixel-light-gray" />
                </div>
                <div className="hidden md:block">
                  <div className="text-pixel-xs font-bold text-pixel-primary uppercase">
                    Connecting...
                  </div>
                </div>
              </div>
            ) : status === "connected" && address ? (
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-pixel-primary pixel-avatar flex items-center justify-center cursor-pointer hover:bg-pixel-secondary transition-colors"
                  onClick={handleDisconnect}
                  title="Click to disconnect"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-pixel-black" />
                </div>
                <div className="hidden md:block">
                  <div className="text-pixel-xs font-bold text-pixel-primary uppercase">
                    {formatAddress(address)}
                  </div>
                  <div className="text-pixel-xs text-pixel-light-gray uppercase">
                    Connected
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="w-auto px-2 sm:px-3 h-8 sm:h-10 bg-pixel-gray pixel-avatar flex items-center justify-center cursor-pointer hover:bg-pixel-primary hover:text-pixel-black transition-colors text-pixel-xs sm:text-pixel-sm"
                onClick={handleConnect}
                title="Click to connect wallet"
              >
                <span className="hidden xs:inline">Connect</span>
                <span className="xs:hidden">💳</span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden w-8 h-8 sm:w-10 sm:h-10 bg-pixel-gray hover:bg-pixel-light-gray pixel-btn border-pixel-light-gray flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-pixel-primary" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-modal lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute top-0 right-0 w-64 h-full bg-pixel-dark-gray border-l-4 border-pixel-gray animate-slide-in">
            <div className="p-6">
              {/* Menu Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-pixel-base font-bold text-pixel-primary uppercase tracking-wider">
                  Navigation
                </h2>
              </div>

              {/* Menu Items */}
              <nav className="space-y-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full pixel-nav-item px-4 py-3 font-bold text-pixel-sm uppercase tracking-wider flex items-center min-h-touch ${
                      currentPage === item.id
                        ? 'text-pixel-primary border-pixel-primary bg-pixel-gray'
                        : 'text-pixel-base-gray hover:text-pixel-accent hover:bg-pixel-gray'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Mobile Notifications */}
              <div className="mt-6 pt-6 border-t-2 border-pixel-gray">
                <h3 className="text-pixel-sm font-bold text-pixel-primary uppercase tracking-wider mb-3">
                  Notifications
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="pixel-notification bg-pixel-secondary border-pixel-black w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-pixel-warning transition-colors relative">
                    <Bell className="w-4 h-4 text-pixel-black" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-pixel-error pixel-avatar"></div>
                  </div>
                  <span className="text-pixel-xs text-pixel-base-gray">
                    No new notifications
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
