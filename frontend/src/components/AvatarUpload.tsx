import { useState } from 'react';
import { Upload, Avatar, Button, message } from 'antd';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile } from 'antd/es/upload/interface';
import { profileApi } from '../api/profile';

interface AvatarUploadProps {
    currentAvatar?: string;
    onUploadSuccess: (avatarUrl: string) => void;
    size?: number;
}

const AvatarUpload = ({ currentAvatar, onUploadSuccess, size = 100 }: AvatarUploadProps) => {
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | undefined>(currentAvatar);

    const beforeUpload = (file: RcFile) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('You can only upload image files!');
            return false;
        }

        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Image must be smaller than 5MB!');
            return false;
        }

        return true;
    };

    const handleChange = async (info: UploadChangeParam) => {
        if (info.file.status === 'uploading') {
            setLoading(true);
            return;
        }

        if (info.file.status === 'done') {
            try {
                const file = info.file.originFileObj as RcFile;
                const result = await profileApi.uploadAvatar(file);

                setImageUrl(result.avatarUrl);
                setLoading(false);
                message.success('Avatar uploaded successfully!');
                onUploadSuccess(result.avatarUrl || '');
            } catch (error) {
                setLoading(false);
                message.error('Failed to upload avatar');
            }
        }

        if (info.file.status === 'error') {
            setLoading(false);
            message.error('Upload failed');
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative">
                <Avatar
                    size={size}
                    src={imageUrl}
                    icon={<UserOutlined />}
                    className="border-4 border-white shadow-lg"
                />
                <Upload
                    name="file"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    onChange={handleChange}
                    customRequest={({ onSuccess }) => {
                        setTimeout(() => {
                            onSuccess?.('ok');
                        }, 0);
                    }}
                >
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<CameraOutlined />}
                        className="absolute bottom-0 right-0"
                        loading={loading}
                    />
                </Upload>
            </div>
        </div>
    );
};

export default AvatarUpload;
