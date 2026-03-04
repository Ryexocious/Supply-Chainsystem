import apiClient from './client';

export const ordersAPI = {
    getAllOrders: async (params = {}) => {
        const response = await apiClient.get('/orders', { params });
        return response.data;
    },

    getOrderStats: async () => {
        const response = await apiClient.get('/orders/stats');
        return response.data;
    },

    getOrderById: async (id) => {
        const response = await apiClient.get(`/orders/${id}`);
        return response.data;
    },

    createOrder: async (data) => {
        const response = await apiClient.post('/orders', data);
        return response.data;
    },

    updateOrder: async (id, data) => {
        const response = await apiClient.put(`/orders/${id}`, data);
        return response.data;
    },

    deleteOrder: async (id) => {
        const response = await apiClient.delete(`/orders/${id}`);
        return response.data;
    },

    generateMonthlyInvoices: async () => {
        // Use native fetch to avoid axios completely for binary downloads, ensuring no JSON interceptors break it.
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/orders/generate-invoices', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || err.error || 'Failed to generate invoices');
        }

        const blob = await response.blob();
        if (blob.type === 'application/json') {
            // It means it returned a 200 message (like 'No orders pending') instead of a PDF
            const text = await blob.text();
            const data = JSON.parse(text);
            throw new Error(data.message);
        }

        // Build a URL from the file
        const fileURL = URL.createObjectURL(blob);

        // Create a temporary anchor tag to trigger the download
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = `Monthly_Invoices_${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(fileURL);

        return true;
    }
};