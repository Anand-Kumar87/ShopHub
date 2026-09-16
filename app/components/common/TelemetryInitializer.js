'use client';

import { useEffect } from 'react';
import { initGlobalErrorListeners } from '../../utils/logger';

export default function TelemetryInitializer() {
    useEffect(() => {
        initGlobalErrorListeners();
    }, []);

    return null;
}
