import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <h1 style={{ color: '#ef4444' }}>EmbedViz Crash Encountered</h1>
                    <p>Please refresh the application.</p>
                    <pre style={{
                        background: '#1e293b',
                        padding: '1rem',
                        borderRadius: '8px',
                        maxWidth: '600px',
                        overflow: 'auto'
                    }}>{this.state.error?.message}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}
