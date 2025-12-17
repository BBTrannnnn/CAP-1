import { client } from './client';
import { UserRole } from '../stores/auth';

// --- Types ---
export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface ReportStats {
    pendingPosts: number;
    pendingComments: number;
    appeals: number;
    totalReports: number;
}

export interface BanPayload {
    userId: string;
    reason: string;
    durationHours?: number; // Optional: ban duration
}

// --- MODERATION API ---
export const ModerationApi = {
    // Pending Content
    getPendingPosts: (params?: PaginationParams & { sort?: 'newest' | 'oldest' }) =>
        client.get<any>(`/api/moderation/pending/posts?page=${params?.page || 1}&limit=${params?.limit || 20}&sort=${params?.sort || 'newest'}`),

    getPendingComments: (params?: PaginationParams) =>
        client.get<any>(`/api/moderation/pending/comments?page=${params?.page || 1}&limit=${params?.limit || 20}`),

    // Get content detail for review
    getContentDetail: (contentType: 'post' | 'comment' | 'appeal' | 'user', contentId: string) =>
        client.get<any>(`/api/moderation/review/${contentType}/${contentId}`),

    // Actions on Content
    approvePost: (postId: string) =>
        client.post(`/api/moderation/approve/post/${postId}`, {}),

    rejectPost: (postId: string, reason: string, notes?: string) =>
        client.post(`/api/moderation/reject/post/${postId}`, { reason, notes }),

    approveComment: (commentId: string) =>
        client.post(`/api/moderation/approve/comment/${commentId}`, {}),

    rejectComment: (commentId: string, reason: string, notes?: string) =>
        client.post(`/api/moderation/reject/comment/${commentId}`, { reason, notes }),

    // Appeals
    getAppeals: (params?: PaginationParams) =>
        client.get<any>(`/api/moderation/appeals?page=${params?.page || 1}&limit=${params?.limit || 20}`),

    resolveAppeal: (contentType: 'post' | 'comment', contentId: string, decision: 'approve' | 'reject', note?: string) => {
        if (decision === 'approve') {
            return client.post(`/api/moderation/approve/${contentType}/${contentId}`, { notes: note });
        } else {
            return client.post(`/api/moderation/reject/${contentType}/${contentId}`, { reason: note || 'Resolved via appeal', notes: note });
        }
    },

    // User Actions
    banUser: (userId: string, reason: string, duration: number) =>
        client.post(`/api/moderation/ban/${userId}`, { reason, duration }),

    unbanUser: (userId: string) =>
        client.post(`/api/moderation/unban/${userId}`, {}),

    // Stats
    getStats: (period?: '1d' | '7d' | '30d') =>
        client.get<ReportStats>(`/api/moderation/stats?period=${period || '7d'}`),

    getOverview: () =>
        client.get<any>('/api/moderation/overview'),

    // Reports (Admin/Mod)
    getReports: (params?: PaginationParams) =>
        client.get<any>(`/api/moderation/reports?page=${params?.page || 1}&limit=${params?.limit || 20}`),

    // Ban Appeals (Admin/Mod) - STUBBED due to missing BE implementation
    // Ban Appeals (Admin/Mod)
    getBanAppeals: (params?: PaginationParams) => {
        return client.get<any>(`/api/moderation/appeals?page=${params?.page || 1}&limit=${params?.limit || 20}`);
    },

    resolveBanAppeal: (appealId: string, action: 'approve' | 'reject', notes?: string) => {
        // Assuming appeals are treated as generic content or have specific endpoints. 
        // Based on BE routes: router.post('/approve/:contentType/:contentId'...)
        // We might need to know the contentType. For now, let's assume 'account' or specific handling.
        // Actually BE has: router.get('/appeals', ... getAppeals) which likely returns mixed types.
        // And resolve uses approve/reject generic routes.
        // If "appealId" is actually a userId or reportId, we need to adapt. 
        // Looking at BE Controller (inferred): submitAppeal is for content. 
        // Let's use the generic approve/reject for now if they are content items.
        return Promise.reject({ message: "Vui lòng sử dụng approveContent/rejectContent cho từng item cụ thể trong danh sách appeal." });
    },

    // Warn User
    warnUser: (userId: string, reason: string) =>
        client.post(`/api/moderation/users/${userId}/warn`, { reason }),

    // Get Reports (for moderation dashboard)
    getReports: (filters?: {
        type?: 'post' | 'comment' | 'user';
        status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
        priority?: number;
        page?: number;
        limit?: number;
    }) => {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.priority) params.append('priority', filters.priority.toString());
        params.append('page', (filters?.page || 1).toString());
        params.append('limit', (filters?.limit || 20).toString());

        return client.get(`/api/moderation/reports?${params.toString()}`);
    },

    // Dismiss Report
    dismissReport: (reportId: string, reason?: string) =>
        client.post(`/api/moderation/reports/${reportId}/dismiss`, { reason }),
};

// --- ADMIN API ---
export const AdminApi = {
    // User Management
    updateUserRole: (userId: string, role: UserRole) =>
        client.patch(`/api/admin/users/${userId}/role`, { role }),

    updateTrustScore: (userId: string, score: number) =>
        client.patch(`/api/admin/users/${userId}/role`, { trustScore: score }),

    getSystemDashboard: () =>
        client.get<any>('/api/admin/system/dashboard'),

    getUserDashboard: () =>
        client.get<any>('/api/admin/users/dashboard'),

    getAllUsers: (params?: PaginationParams) =>
        client.get<any>(`/api/admin/users?page=${params?.page || 1}&limit=${params?.limit || 20}`),
};

// --- SOCIAL API (Migrated parts or Extensions) ---
// Note: Core social logic might still reside in users.js for legacy reasons, 
// but can be gradually moved here.
export const SocialApi = {
    createAppeal: (type: 'post' | 'comment' | 'account', targetId: string, reason: string) =>
        client.post('/api/social/appeals', { type, targetId, reason }),

    // Submit appeal for rejected content
    submitAppeal: (contentType: 'post' | 'comment', contentId: string, reason: string) =>
        client.post(`/api/moderation/appeal/${contentType}/${contentId}`, { reason }),

    // Submit appeal for ban
    submitBanAppeal: (userId: string, reason: string) => {
        return client.post(`/api/moderation/appeal/user/${userId}`, { reason });
    },

    // Report content
    reportContent: (contentType: 'post' | 'comment', contentId: string, reason: string, description?: string) => {
        const endpoint = contentType === 'post'
            ? `/api/posts/${contentId}/report`
            : `/api/comments/${contentId}/report`;
        return client.post(endpoint, { reason, description });
    },

    // Delete post
    deletePost: (postId: string) =>
        client.delete(`/api/posts/${postId}`),
};
