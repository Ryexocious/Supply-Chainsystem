import apiClient from './client';

export const activityAPI = {
    getRecentActivity: async () => {
        const response = await apiClient.get('/activity');
        return response.data;
    }
};
