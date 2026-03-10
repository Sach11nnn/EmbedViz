import React, { Component, type ErrorInfo, type ReactNode } from 'react';
interface Props {
    children?: ReactNode;
}
interface State {
    hasError: boolean;
    error?: Error;
}
export declare class ErrorBoundary extends Component<Props, State> {
    state: State;
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    render(): string | number | boolean | import("react/jsx-runtime").JSX.Element | Iterable<React.ReactNode> | null | undefined;
}
export {};
//# sourceMappingURL=ErrorBoundary.d.ts.map