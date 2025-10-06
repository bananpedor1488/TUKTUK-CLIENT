import axios from './axiosConfig';

const WalletService = {
  async getBalance() {
    try {
      const res = await axios.get('/wallet/balance');
      return res?.data?.balance ?? 0;
    } catch (e) {
      return 0;
    }
  },

  async purchasePremium() {
    // Costs 300 B coins
    const res = await axios.post('/wallet/purchase-premium', { cost: 300 });
    return res.data;
  },

  async redeemPromo(code) {
    const res = await axios.post('/wallet/redeem', { code });
    return res.data;
  },

  async createPromo({ type, amount }) {
    // type: 'premium' | 'coins'; amount used only for coins
    const res = await axios.post('/wallet/create-promo', { type, amount });
    return res.data;
  },
};

export default WalletService;
