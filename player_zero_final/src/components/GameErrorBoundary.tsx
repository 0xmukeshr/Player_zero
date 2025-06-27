import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('GameInterface Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-pixel-black flex items-center justify-center">
          <div className="bg-pixel-dark-gray pixel-panel border-pixel-gray p-8 max-w-md">
            <h2 className="text-pixel-xl font-bold text-pixel-primary text-center mb-4">
              Game Error
            </h2>
            <p className="text-pixel-base-gray text-center mb-6">
              Something went wrong with the game interface.
            </p>
            {this.state.error && (
              <div className="bg-pixel-error text-pixel-black p-3 pixel-panel border-pixel-black mb-4">
                <p className="text-pixel-xs font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex space-x-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-pixel-primary hover:bg-pixel-success text-pixel-black font-bold pixel-btn"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-pixel-gray hover:bg-pixel-light-gray text-pixel-primary font-bold pixel-btn"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
