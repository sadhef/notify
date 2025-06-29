const express = require("express");
const app = express();
const webpush = require('web-push');
const cors = require("cors");
const path = require('path'); // Core Node.js module for handling file paths

const port = 3000;

const apiKeys = {
    // VAPID keys generated for your push service.
    // In a real application, these might be stored as environment variables.
    publicKey: "BAmYCdxac-MsCQq2dnPjnnYE2SQALllkc0IUeF4xzJZgVTlvnYDsGQ79uslOqGV5fJNwwdaJyQzEvqbE6vKv_9g",
    privateKey: "A8Hllb_tGVS1KV8o7lY3nkslZb5PcwTFmjb_bvCOaoo"
}

// Set VAPID details for web-push.
// The 'mailto:' contact is used by push services to contact you if there are issues.
webpush.setVapidDetails(
    'mailto:muhammedsadhef@gmail.com', // **IMPORTANT: Use your actual email address here**
    apiKeys.publicKey,
    apiKeys.privateKey
);

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing for browser requests
app.use(express.json()); // Enable parsing of JSON request bodies

// Serve static files from the 'public' directory.
// This allows files like index.html, script.js, and sw.js to be accessed by the browser.
app.use(express.static(path.join(__dirname, 'public')));

// Define the root route. When a user visits http://localhost:3000/,
// this route will send the index.html file from the 'public' folder.
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// A temporary array to store push subscription objects.
// In a production application, this would be a persistent database (e.g., MongoDB, PostgreSQL).
const subDatabse = [];

// POST route to receive and save a push subscription from the client (service worker).
app.post("/save-subscription", (req, res) => {
    // Basic validation to ensure a subscription object is received.
    if (req.body && Object.keys(req.body).length > 0) {
        subDatabse.push(req.body); // Add the new subscription to our database
        console.log('Subscription saved:', req.body); // Log the subscription for debugging
        res.json({ status: "Success", message: "Subscription saved!" });
    } else {
        console.log('Attempted to save empty/invalid subscription');
        res.status(400).json({ status: "Error", message: "Invalid subscription data" });
    }
});

// GET route to trigger sending a push notification to the first subscribed user.
app.get("/send-notification", (req, res) => {
    // Check if there are any subscriptions to send a notification to.
    if (subDatabse.length > 0) {
        const payload = "Hello world"; // The data payload for your notification
        const options = {
            // Options for the notification, e.g., TTL (Time To Live), urgency.
            // For simplicity, we are using defaults here.
        };

        // Send the notification to the first subscribed endpoint.
        webpush.sendNotification(subDatabse[0], payload, options)
            .then(() => {
                console.log('Notification sent successfully!');
                res.json({ "statue": "Success", "message": "Message sent to push service" });
            })
            .catch(error => {
                // Handle errors during notification sending (e.g., subscription expired)
                console.error('Error sending notification:', error);
                res.status(500).json({ "statue": "Error", "message": "Failed to send notification" });
            });
    } else {
        console.log('No subscriptions found to send notification to.');
        res.json({ "statue": "Error", "message": "No subscriptions found" });
    }
});

// Start the Express server and listen for incoming requests on the specified port.
app.listen(port, () => {
    console.log(`Server running on port ${port}!`);
});