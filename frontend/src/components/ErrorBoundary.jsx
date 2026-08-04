import React from "react";

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReset = () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {
            console.error("Clear storage failed", e);
        }
        window.location.href = "/login";
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6 text-center">
                    <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl space-y-4">
                        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                            ⚠️
                        </div>
                        <h1 className="text-xl font-bold text-white">Session State Reset Required</h1>
                        <p className="text-sm text-slate-300">
                            A browser storage value was modified or deleted. Click below to clear invalid session data and return to login screen.
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl transition shadow-lg"
                        >
                            Reset App & Go to Login
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
