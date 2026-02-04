import { Button, Card } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

function App() {
  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card
        className="w-full max-w-md shadow-2xl"
        bordered={false}
      >
        <div className="text-center space-y-6 p-6">
          {/* Logo/Title */}
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              NestJS Chat
            </h1>
            <p className="text-gray-600">
              Sign in to start chatting
            </p>
          </div>

          {/* Google Login Button */}
          <div className="pt-4">
            <Button
              type="primary"
              size="large"
              icon={<GoogleOutlined />}
              onClick={handleGoogleLogin}
              className="w-full h-12 text-lg font-semibold"
            >
              Sign in with Google
            </Button>
          </div>

          {/* Footer */}
          <div className="pt-6 text-sm text-gray-500">
            <p>Secure authentication powered by Google OAuth 2.0</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default App;
