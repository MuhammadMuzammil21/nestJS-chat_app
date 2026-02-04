import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin } from 'antd';

function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const handleCallback = () => {
            try {
                // Extract tokens from URL parameters
                const accessToken = searchParams.get('accessToken');
                const refreshToken = searchParams.get('refreshToken');
                const userStr = searchParams.get('user');

                if (accessToken && refreshToken && userStr) {
                    // Store tokens in localStorage
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                    localStorage.setItem('user', userStr);

                    // Redirect to dashboard
                    navigate('/dashboard');
                } else {
                    console.error('No tokens received');
                    navigate('/');
                }
            } catch (error) {
                console.error('Auth callback error:', error);
                navigate('/');
            }
        };

        handleCallback();
    }, [navigate, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <Spin size="large" />
                <p className="mt-4 text-gray-600">Completing sign in...</p>
            </div>
        </div>
    );
}

export default AuthCallback;
