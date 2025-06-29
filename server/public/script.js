// Checks for necessary browser features for push notifications.
const checkPermission = () => {
    if (!('serviceWorker' in navigator)) {
        throw new Error("Browser does not support Service Workers!");
    }

    if (!('Notification' in window)) {
        throw new Error("Browser does not support Notification API!");
    }

    if (!('PushManager' in window)) {
        throw new Error("Browser does not support Push API!");
    }
};

// Registers the Service Worker file (sw.js).
const registerSW = async () => {
    try {
        const registration = await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker registered successfully:', registration);
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw new Error("Failed to register Service Worker.");
    }
};

// Requests permission from the user to show notifications.
const requestNotificationPermission = async () => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            return permission;
        } else {
            console.warn('Notification permission denied or dismissed.');
            throw new Error("Notification permission not granted.");
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        throw error;
    }
};

// Main function called by the "Enable notification" button.
const main = async () => {
    try {
        console.log('Starting notification setup...');
        checkPermission(); // Check if browser supports required APIs
        await requestNotificationPermission(); // Ask user for permission
        await registerSW(); // Register the service worker
        console.log('Notification setup complete. Ready to receive push messages.');
    } catch (error) {
        console.error('Error during notification setup:', error);
        alert(`Notification setup failed: ${error.message}. Please check console for details.`);
    }
};