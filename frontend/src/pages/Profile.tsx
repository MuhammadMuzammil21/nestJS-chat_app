import { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Spin, message, Descriptions, Divider } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileApi, type ProfileData, type UpdateProfileData } from '../api/profile';
import AvatarUpload from '../components/AvatarUpload';
import RoleBadge from '../components/RoleBadge';

const { TextArea } = Input;

function Profile() {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [form] = Form.useForm();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await profileApi.getProfile();
            setProfileData(data);
            form.setFieldsValue({
                displayName: data.displayName,
                statusMessage: data.statusMessage || '',
            });
        } catch (error) {
            message.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        form.setFieldsValue({
            displayName: profileData?.displayName,
            statusMessage: profileData?.statusMessage || '',
        });
    };

    const handleSave = async (values: UpdateProfileData) => {
        try {
            setLoading(true);
            const updatedProfile = await profileApi.updateProfile(values);
            setProfileData(updatedProfile);
            setIsEditing(false);
            message.success('Profile updated successfully!');

            // Update auth context with new user data
            if (user) {
                login({
                    accessToken: localStorage.getItem('accessToken') || '',
                    refreshToken: localStorage.getItem('refreshToken') || '',
                    user: {
                        ...user,
                        displayName: updatedProfile.displayName,
                        avatarUrl: updatedProfile.avatarUrl,
                    },
                });
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to update profile';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUploadSuccess = (avatarUrl: string) => {
        setProfileData(prev => prev ? { ...prev, avatarUrl } : null);

        // Update auth context
        if (user) {
            login({
                accessToken: localStorage.getItem('accessToken') || '',
                refreshToken: localStorage.getItem('refreshToken') || '',
                user: {
                    ...user,
                    avatarUrl,
                },
            });
        }
    };

    if (loading && !profileData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto">
                <Card
                    className="shadow-2xl"
                    title={
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold">Profile</h1>
                            <div className="flex gap-2">
                                {!isEditing ? (
                                    <>
                                        <Button
                                            type="primary"
                                            icon={<EditOutlined />}
                                            onClick={handleEdit}
                                        >
                                            Edit Profile
                                        </Button>
                                        <Button
                                            icon={<ArrowLeftOutlined />}
                                            onClick={() => navigate('/dashboard')}
                                        >
                                            Back to Dashboard
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            type="primary"
                                            icon={<SaveOutlined />}
                                            onClick={() => form.submit()}
                                            loading={loading}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            icon={<CloseOutlined />}
                                            onClick={handleCancel}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    }
                >
                    {profileData && (
                        <>
                            <div className="flex flex-col items-center mb-8">
                                <AvatarUpload
                                    currentAvatar={profileData.avatarUrl}
                                    onUploadSuccess={handleAvatarUploadSuccess}
                                    size={120}
                                />
                                <div className="mt-4 text-center">
                                    <h2 className="text-2xl font-semibold text-gray-800">
                                        {profileData.displayName}
                                    </h2>
                                    <p className="text-gray-600">{profileData.email}</p>
                                    <div className="mt-2">
                                        <RoleBadge role={profileData.role} />
                                    </div>
                                </div>
                            </div>

                            {!isEditing ? (
                                <>
                                    <Divider>Profile Information</Divider>
                                    <Descriptions bordered column={1}>
                                        <Descriptions.Item label="Display Name">
                                            {profileData.displayName}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Email">
                                            {profileData.email}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Status Message">
                                            {profileData.statusMessage || 'No status message'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Role">
                                            <RoleBadge role={profileData.role} />
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Subscription">
                                            {profileData.subscriptionStatus}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Member Since">
                                            {new Date(profileData.createdAt).toLocaleDateString()}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Last Updated">
                                            {new Date(profileData.updatedAt).toLocaleDateString()}
                                        </Descriptions.Item>
                                    </Descriptions>
                                </>
                            ) : (
                                <>
                                    <Divider>Edit Profile</Divider>
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleSave}
                                        initialValues={{
                                            displayName: profileData.displayName,
                                            statusMessage: profileData.statusMessage || '',
                                        }}
                                    >
                                        <Form.Item
                                            label="Display Name"
                                            name="displayName"
                                            rules={[
                                                { required: true, message: 'Please enter your display name' },
                                                { min: 2, message: 'Display name must be at least 2 characters' },
                                                { max: 50, message: 'Display name must not exceed 50 characters' },
                                            ]}
                                        >
                                            <Input placeholder="Enter your display name" />
                                        </Form.Item>

                                        <Form.Item
                                            label="Status Message"
                                            name="statusMessage"
                                            rules={[
                                                { max: 200, message: 'Status message must not exceed 200 characters' },
                                            ]}
                                        >
                                            <TextArea
                                                rows={3}
                                                placeholder="What's on your mind?"
                                                showCount
                                                maxLength={200}
                                            />
                                        </Form.Item>
                                    </Form>
                                </>
                            )}
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default Profile;
