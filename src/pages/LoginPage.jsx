import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const { signIn, signUp } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        if (isSignUp) {
            // Sign Up
            const { error: signUpError } = await signUp(email, password, { full_name: fullName });

            if (signUpError) {
                setError(signUpError);
                setLoading(false);
            } else {
                setSuccessMessage('Account created! Please check your email to verify your account.');
                setLoading(false);
                // Optionally switch to login mode after successful signup
                setTimeout(() => {
                    setIsSignUp(false);
                    setSuccessMessage('');
                }, 3000);
            }
        } else {
            // Sign In
            const { error: signInError } = await signIn(email, password);

            if (signInError) {
                setError(signInError);
                setLoading(false);
            }
        }
        // On success, AuthContext will update user state and App will redirect
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="card max-w-md w-full p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary-700">ATR Express</h1>
                    <p className="text-gray-600 mt-2">Sales CRM {isSignUp ? 'Sign Up' : 'Login'}</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="label">Full Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    )}

                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="sales@atrexpress.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="label">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                            setSuccessMessage('');
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        disabled={loading}
                    >
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>

                <p className="text-center text-sm text-gray-500 mt-4">
                    ATR Express Sales Team Only
                </p>
            </div>
        </div>
    );
}
