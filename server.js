// 1. Imports
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs'); // NEW: Password encryption tool

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// 3. Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas permanently!'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// --- 4. DATABASE BLUEPRINTS (SCHEMAS) ---

// NEW: The User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// UPDATED: The Bill Schema (Now includes a userId)
const billSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // This links the bill to a specific user
    month: { type: String, required: true },
    units: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, default: Date.now }
});
const Bill = mongoose.model('Bill', billSchema);


// --- 5. AUTHENTICATION API ENDPOINTS ---

// POST: Create a new account (Sign Up)
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // 2. Encrypt (Hash) the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Save the new user to the database
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        console.log("New user registered:", email);
        // Send back the unique User ID so the frontend can log them in
        res.status(201).json({ message: "Account created!", userId: newUser._id });

    } catch (error) {
        res.status(500).json({ message: "Server error during signup" });
    }
});

// POST: Log into an existing account (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // 2. Compare the typed password with the encrypted password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log("User logged in:", email);
        // Send back the unique User ID
        res.json({ message: "Login successful!", userId: user._id });

    } catch (error) {
        res.status(500).json({ message: "Server error during login" });
    }
});


// --- 6. BILLS API ENDPOINTS (Secured) ---

// GET: Fetch bills only for the logged-in user
app.get('/api/bills/:userId', async (req, res) => {
    try {
        // Search the database ONLY for bills matching this specific user's ID
        const userBills = await Bill.find({ userId: req.params.userId }).sort({ createdAt: 1 });
        res.json(userBills);
    } catch (error) {
        res.status(500).json({ message: "Error fetching data" });
    }
});

// POST: Save a new bill attached to the logged-in user
app.post('/api/bills', async (req, res) => {
    try {
        const newBill = new Bill({
            userId: req.body.userId, // Save the owner's ID with the bill
            month: req.body.month,
            cost: req.body.cost,
            units: req.body.units
        });
        
        await newBill.save(); 
        res.status(201).json({ message: "Bill saved successfully!" });
    } catch (error) {
        res.status(400).json({ message: "Error saving data", error: error.message });
    }
});

// --- 7. START SERVER ---
app.listen(PORT, () => {
    console.log(`⚡ PowerHouse server is running at http://localhost:${PORT}`);
});