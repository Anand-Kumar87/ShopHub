'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { FiX, FiMail } from 'react-icons/fi';

const safeDate = (dateString) => {
    if (!dateString) return 'Not Set';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Not Set' : d.toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    }).toUpperCase();
};

export default function Inquiries() {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);

    // 🔥 SAFE FETCH & REALTIME
    useEffect(() => {
        let msgSubscription = null;

        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                // No order() to prevent 500 crashes
                const { data, error } = await supabase.from('inquiries').select('*');

                if (data && !error) {
                    const sortedMessages = data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                    setMessages(sortedMessages);
                }

                // Realtime sync
                msgSubscription = supabase.channel(`live-inquiries-${Date.now()}`)
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, payload => {
                        if (payload.eventType === 'INSERT') setMessages(prev => [payload.new, ...prev]);
                        else if (payload.eventType === 'UPDATE') setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
                        else if (payload.eventType === 'DELETE') setMessages(prev => prev.filter(m => m.id !== payload.old.id));
                    }).subscribe();

            } catch (error) {
                console.error("Message Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();

        return () => {
            if (msgSubscription) supabase.removeChannel(msgSubscription);
        };
    }, []);

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'unread': return 'bg-stone-900 text-white shadow-sm';
            case 'read': return 'bg-stone-100 text-stone-500';
            default: return 'bg-stone-100 text-stone-900';
        }
    };

    const viewMessage = async (msg) => {
        setSelectedMessage(msg);
        setIsMessageModalOpen(true);

        // Auto mark as read
        if (msg.status === 'unread') {
            setMessages(messages.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
            await supabase.from('inquiries').update({ status: 'read' }).eq('id', msg.id);
        }
    };

    if (isLoading) {
        return <div className="text-stone-400 text-sm animate-pulse pt-10">Loading Client Inquiries...</div>;
    }

    return (
        <> {/* 🔥 MODAL FIX */}
            <div className="animate-fade-in space-y-8">
                <div className="flex justify-between items-center border-b border-stone-200 pb-4">
                    <h2 className="text-2xl font-light text-stone-900">Client <span className="font-serif italic font-bold">Inquiries</span></h2>
                </div>

                <div className="overflow-x-auto pb-10">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b-2 border-stone-900">
                                <th className="py-4 pr-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Sender</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Subject</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Date</th>
                                <th className="py-4 px-4 font-bold tracking-widest uppercase text-[10px] text-stone-400">Status</th>
                                <th className="py-4 pl-4 font-bold tracking-widest uppercase text-[10px] text-stone-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-stone-600">
                            {messages.map(msg => (
                                <tr key={msg.id} className={`border-b border-stone-100 hover:bg-stone-50/50 transition-colors ${msg.status === 'unread' ? 'bg-stone-50/30' : ''}`}>
                                    <td className="py-5 pr-4">
                                        <p className={`font-medium ${msg.status === 'unread' ? 'text-stone-900 font-bold' : 'text-stone-700'}`}>
                                            {msg.sender || msg.name || 'Unknown Client'}
                                        </p>
                                        <p className="text-[10px] text-stone-400">{msg.email}</p>
                                        {msg.phone && <p className="text-[10px] text-stone-400 font-mono mt-0.5">{msg.phone}</p>}
                                    </td>
                                    <td className={`py-5 px-4 ${msg.status === 'unread' ? 'font-bold text-stone-900' : ''}`}>
                                        {msg.subject || 'No Subject'}
                                    </td>
                                    <td className="py-5 px-4 text-xs font-medium">
                                        {safeDate(msg.created_at || msg.date)}
                                    </td>
                                    <td className="py-5 px-4">
                                        <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full inline-block ${getStatusStyle(msg.status)}`}>
                                            {msg.status || 'unread'}
                                        </span>
                                    </td>
                                    <td className="py-5 pl-4 text-right">
                                        <button
                                            onClick={() => viewMessage(msg)}
                                            className="text-[10px] font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 border-b border-stone-300 pb-0.5 hover:border-stone-900 transition-colors"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {messages.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-stone-400 text-sm">
                                        No new inquiries.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🔥 MODAL OUTSIDE DIV */}
            {isMessageModalOpen && selectedMessage && (
                <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-16 overflow-y-auto pb-24 custom-scrollbar">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-100 flex flex-col max-h-[90vh] animate-fade-in">
                        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 sticky top-0">
                            <h3 className="text-xl font-light text-stone-900">Client <span className="font-serif italic font-bold">Inquiry</span></h3>
                            <button onClick={() => setIsMessageModalOpen(false)} className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors">
                                <FiX size={16} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto hide-scrollbar">
                            <div className="flex justify-between items-start mb-8 pb-6 border-b border-stone-100">
                                <div>
                                    <p className="text-sm font-bold text-stone-900">{selectedMessage.sender || selectedMessage.name}</p>
                                    <p className="text-sm text-stone-500">{selectedMessage.email}</p>
                                    {selectedMessage.phone && <p className="text-sm text-stone-500 font-mono mt-1">{selectedMessage.phone}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-stone-400 font-medium bg-stone-100 px-3 py-1 rounded-full">
                                        {safeDate(selectedMessage.created_at || selectedMessage.date)}
                                    </p>
                                </div>
                            </div>
                            <div className="mb-6">
                                <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Subject</h4>
                                <p className="font-medium text-stone-900 text-lg">{selectedMessage.subject || 'No Subject Provided'}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-2">Message Content</h4>
                                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap bg-stone-50 p-6 rounded-2xl border border-stone-100 shadow-inner">
                                    {selectedMessage.message}
                                </p>
                            </div>
                            <div className="pt-8 mt-8 flex justify-end gap-3 border-t border-stone-100">
                                <a
                                    href={`mailto:${selectedMessage.email}?subject=RE: ${selectedMessage.subject || 'Your Inquiry'}`}
                                    className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 text-xs font-bold tracking-widest uppercase shadow-lg shadow-stone-900/10 transition-colors flex items-center gap-2"
                                >
                                    <FiMail size={14} /> Reply via Email
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}