'use client';
import { SWRConfig } from 'swr';

export default function SWRProvider({ children }) {
    return (
        <SWRConfig value={{
            revalidateOnFocus: false,      // Prevent reload/skeleton flash when user switches browser tabs
            revalidateOnReconnect: false,  // Prevent flash on network reconnect
            revalidateIfStale: false,      // Reuse fresh cached data
            dedupingInterval: 120000       // Deduplicate requests within 2 minutes
        }}>
            {children}
        </SWRConfig>
    );
}