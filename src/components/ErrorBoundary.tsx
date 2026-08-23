"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackMessage: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-gray-500">
          <p className="font-medium mb-1">Something went wrong.</p>
          <p className="text-sm">{this.props.fallbackMessage}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
