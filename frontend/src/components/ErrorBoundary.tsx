import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        console.error('Error caught by ErrorBoundary:', error, errorInfo);

        // You can also log to an error reporting service here
        // Example: logErrorToService(error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
                        <div className="text-center">
                            <div className="text-6xl mb-4">⚠️</div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                Oops! Something went wrong
                            </h1>
                            <p className="text-gray-600 mb-6">
                                We're sorry for the inconvenience. An unexpected error has occurred.
                            </p>

                            {import.meta.env.DEV && this.state.error && (
                                <details className="mb-6 text-left">
                                    <summary className="cursor-pointer text-sm text-gray-700 font-semibold mb-2">
                                        Error Details (Development Only)
                                    </summary>
                                    <div className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
                                        <p className="font-semibold text-red-600 mb-2">
                                            {this.state.error.toString()}
                                        </p>
                                        {this.state.errorInfo && (
                                            <pre className="text-gray-700 whitespace-pre-wrap">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        )}
                                    </div>
                                </details>
                            )}

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={this.handleReset}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Go Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
