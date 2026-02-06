import { Tag } from 'antd';
import { CrownOutlined, StarOutlined, UserOutlined } from '@ant-design/icons';

interface RoleBadgeProps {
    role: string;
    size?: 'small' | 'default' | 'large';
}

const RoleBadge = ({ role, size = 'default' }: RoleBadgeProps) => {
    const getRoleConfig = () => {
        switch (role) {
            case 'ADMIN':
                return {
                    color: 'purple',
                    icon: <CrownOutlined />,
                    text: 'Admin',
                };
            case 'PREMIUM':
                return {
                    color: 'blue',
                    icon: <StarOutlined />,
                    text: 'Premium',
                };
            case 'FREE':
            default:
                return {
                    color: 'default',
                    icon: <UserOutlined />,
                    text: 'Free',
                };
        }
    };

    const config = getRoleConfig();

    return (
        <Tag color={config.color} icon={config.icon} className={size === 'large' ? 'text-base px-4 py-1' : ''}>
            {config.text}
        </Tag>
    );
};

export default RoleBadge;
