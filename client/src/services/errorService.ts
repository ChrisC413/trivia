interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

export const errorService = {
  logError(error: Error | string) {
    const errorLog: ErrorLog = {
      message: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error:', errorLog);
    }

    // Send to server
    fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorLog),
    }).catch(err => {
      console.error('Failed to log error to server:', err);
    });
  },

  clearLocalCache() {
    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear any cached data in memory
    if (window.caches) {
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
    }
  },
};
