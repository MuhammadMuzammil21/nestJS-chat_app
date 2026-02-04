import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Avatar, Descriptions, message } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';

interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    role: string;
}

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check if user is authenticated
        const accessToken = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');

        if (!accessToken || !userData) {
            navigate('/');
            return;
        }

        setUser(JSON.parse(userData));
    }, [navigate]);

    const handleLogout = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');

            // Call logout endpoint
            await fetch('http://localhost:3000/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            // Clear local storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            message.success('Logged out successfully');
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            message.error('Failed to logout');
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto">
                <Card
                    className="shadow-2xl"
                    title={
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold">Dashboard</h1>
                            <Button
                                type="primary"
                                danger
                                icon={<LogoutOutlined />}
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </div>
                    }
                >
                    <div className="flex items-center space-x-6 mb-8">
                        <Avatar
                            size={80}
                            src={user.avatarUrl}
                            icon={<UserOutlined />}
                        />
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-800">
                                {user.displayName}
                            </h2>
                            <p className="text-gray-600">{user.email}</p>
                        </div>
                    </div>

                    <Descriptions title="User Information" bordered column={1}>
                        <Descriptions.Item label="User ID">{user.id}</Descriptions.Item>
                        <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                        <Descriptions.Item label="Display Name">{user.displayName}</Descriptions.Item>
                        <Descriptions.Item label="Role">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                {user.role}
                            </span>
                        </Descriptions.Item>
                    </Descriptions>

                    <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-green-800 mb-2">
                            🎉 Authentication Successful!
                        </h3>
                        <p className="text-green-700">
                            You have successfully logged in using Google OAuth 2.0.
                            Your JWT tokens are securely stored and ready to use for API requests.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Dashboard;
