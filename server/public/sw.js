// Helper function to convert a Base64 string to a Uint8Array.
// This is necessary for the VAPID public key.
const urlBase64ToUint8Array = base64String => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
};

// Function to send the push subscription object to your server.
const saveSubscription = async (subscription) => {
    console.log('Sending subscription to server...');
    try {
        const response = await fetch('http://localhost:3000/save-subscription', {
            method: 'post', // This is crucial: it must be a POST request
            headers: { 'Content-type': "application/json" },
            body: JSON.stringify(subscription)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server responded with status ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log('Subscription saved on server:', data);
        return data;
    } catch (error) {
        console.error('Error saving subscription:', error);
        throw error;
    }
};

// Service Worker 'activate' event listener.
// This is a good place to subscribe the user to push notifications after the SW is active.
self.addEventListener("activate", async (e) => {
    console.log('Service Worker activated.');
    try {
        // Attempt to get an existing subscription first
        let subscription = await self.registration.pushManager.getSubscription();
        if (!subscription) {
            // If no subscription exists, create a new one.
            subscription = await self.registration.pushManager.subscribe({
                userVisibleOnly: true, // All push messages will be displayed to the user.
                // Your public VAPID key is used to identify your server to the push service.
                applicationServerKey: urlBase64ToUint8Array("BAmYCdxac-MsCQq2dnPjnnYE2SQALllkc0IUeF4xzJZgVTlvnYDsGQ79uslOqGV5fJNwwdaJyQzEvqbE6vKv_9g")
            });
            console.log('New push subscription created:', subscription);
            const response = await saveSubscription(subscription); // Send the new subscription to your server
            console.log('Server response to new subscription:', response);
        } else {
            console.log('Existing push subscription found:', subscription);
            // Optionally, resend the existing subscription to ensure server has it,
            // though getSubscription() usually implies it's already there.
            // await saveSubscription(subscription);
        }
    } catch (error) {
        console.error('Error during service worker activation and subscription:', error);
    }
});

// Service Worker 'push' event listener.
// This fires when a push message is received from the push service.
self.addEventListener("push", e => {
    console.log('Push notification received:', e);
    const notificationData = e.data.json(); // Assuming your payload is JSON
    const title = notificationData.title || "Push Notification";
    const options = {
        body: notificationData.body || "You received a push message!",
        icon: notificationData.icon || '/icon.png' // You can add an icon path here
        // Add other notification options like image, actions, etc.
    };

    // Show the notification to the user.
    e.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Service Worker 'notificationclick' event listener.
// This fires when the user clicks on a displayed notification.
self.addEventListener('notificationclick', e => {
    console.log('Notification clicked:', e);
    e.notification.close(); // Close the notification

    // Example: Open a specific URL when notification is clicked
    e.waitUntil(
        clients.openWindow('http://localhost:3000/') // Or any relevant URL
    );
});

// Service Worker 'sync' event listener.
// Useful for background data synchronization when connectivity is restored.
self.addEventListener('sync', e => {
    console.log('Background sync event:', e.tag);
    if (e.tag === 'test-tag-from-devtools' || e.tag === 'nie') { // Match tags used in your logs
        e.waitUntil(
            // Perform background sync operation here, e.g., re-sync data
            new Promise(resolve => {
                console.log(`Performing background sync for tag: ${e.tag}`);
                // Simulate a network request or data processing
                setTimeout(() => {
                    console.log(`Background sync for ${e.tag} complete.`);
                    resolve();
                }, 1000);
            })
        );
    }
});