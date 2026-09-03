export const dynamic = 'force-dynamic';
import AccountContent from './AccountContent';

export default function AccountPage() {
    // 🔥 ULTRA-FAST 0ms LOAD (No Server-Side Blocking)
    // अब सर्वर डेटाबेस का इंतज़ार नहीं करेगा। 
    // AccountContent.js तुरंत LocalStorage से डेटा दिखाएगा और बैकग्राउंड में असली डेटा ले आएगा।

    return <AccountContent serverUser={null} serverOrders={[]} serverCoupons={[]} />;
}
