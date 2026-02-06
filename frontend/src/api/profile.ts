import axiosInstance from '../lib/axios';

export interface ProfileData {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    statusMessage?: string;
    role: string;
    subscriptionStatus: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateProfileData {
    displayName?: string;
    avatarUrl?: string;
    statusMessage?: string;
}

export const profileApi = {
    getProfile: async (): Promise<ProfileData> => {
        const response = await axiosInstance.get<ProfileData>('/profile');
        return response.data;
    },

    updateProfile: async (data: UpdateProfileData): Promise<ProfileData> => {
        const response = await axiosInstance.put<ProfileData>('/profile', data);
        return response.data;
    },

    uploadAvatar: async (file: File): Promise<ProfileData> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axiosInstance.post<ProfileData>('/profile/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
