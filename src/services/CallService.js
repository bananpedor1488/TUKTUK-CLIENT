import api from './axiosConfig';

const CallService = {
  initiate: async ({ chatId, type = 'audio' }) => {
    const { data } = await api.post('/calls/initiate', { chatId, type });
    return data;
  },
  accept: async (callId) => {
    const { data } = await api.post(`/calls/accept/${callId}`);
    return data;
  },
  decline: async (callId) => {
    const { data } = await api.post(`/calls/decline/${callId}`);
    return data;
  },
  end: async (callId) => {
    const { data } = await api.post(`/calls/end/${callId}`);
    return data;
  },
  cleanup: async () => {
    const { data } = await api.post('/calls/cleanup');
    return data;
  },
  cleanupChat: async (chatId) => {
    const { data } = await api.post(`/calls/cleanup-chat/${chatId}`);
    return data;
  },
  active: async () => {
    const { data } = await api.get('/calls/active');
    return data;
  },
  history: async (chatId, { page = 1, limit = 20 } = {}) => {
    const { data } = await api.get(`/calls/history/${chatId}?page=${page}&limit=${limit}`);
    return data;
  }
};

export default CallService;
