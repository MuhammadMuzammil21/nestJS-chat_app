import { Alert, Button } from 'antd';
import { RocketOutlined } from '@ant-design/icons';

interface UpgradeBannerProps {
    feature?: string;
    onClose?: () => void;
}

const UpgradeBanner = ({ feature = 'this feature', onClose }: UpgradeBannerProps) => {
    return (
        <Alert
            message="Premium Feature"
            description={
                <div className="space-y-2">
                    <p>Upgrade to Premium to unlock {feature} and many more features!</p>
                    <div className="flex gap-2">
                        <Button type="primary" icon={<RocketOutlined />} size="small">
                            Upgrade to Premium
                        </Button>
                        {onClose && (
                            <Button size="small" onClick={onClose}>
                                Maybe Later
                            </Button>
                        )}
                    </div>
                </div>
            }
            type="info"
            showIcon
            closable={!!onClose}
            onClose={onClose}
            className="mb-4"
        />
    );
};

export default UpgradeBanner;
