import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Component } from 'react';
export class ErrorBoundary extends Component {
    state = {
        hasError: false
    };
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { style: {
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontFamily: 'system-ui, sans-serif'
                }, children: [_jsx("h1", { style: { color: '#ef4444' }, children: "EmbedViz Crash Encountered" }), _jsx("p", { children: "Please refresh the application." }), _jsx("pre", { style: {
                            background: '#1e293b',
                            padding: '1rem',
                            borderRadius: '8px',
                            maxWidth: '600px',
                            overflow: 'auto'
                        }, children: this.state.error?.message })] }));
        }
        return this.props.children;
    }
}
//# sourceMappingURL=ErrorBoundary.js.map