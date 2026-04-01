// 1. Imports
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');

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

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Bill Schema
const billSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    month: { type: String, required: true },
    units: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, default: Date.now }
});
const Bill = mongoose.model('Bill', billSchema);

// --- 5. AUTHENTICATION API ENDPOINTS ---

// Signup
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        console.log("New user registered:", email);
        res.status(201).json({ message: "Account created!", userId: newUser._id });

    } catch (error) {
        res.status(500).json({ message: "Server error during signup" });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log("User logged in:", email);
        res.json({ message: "Login successful!", userId: user._id });

    } catch (error) {
        res.status(500).json({ message: "Server error during login" });
    }
});

// --- 6. BILLS API ENDPOINTS ---

// GET bills for user
app.get('/api/bills/:userId', async (req, res) => {
    try {
        const userBills = await Bill.find({ userId: req.params.userId }).sort({ createdAt: 1 });
        res.json(userBills);
    } catch (error) {
        res.status(500).json({ message: "Error fetching data" });
    }
});

// ✅ NEW: DELETE bill
app.delete('/api/bills/:id', async (req, res) => {
    try {
        await Bill.findByIdAndDelete(req.params.id);
        res.json({ message: "Bill deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting bill" });
    }
});

// POST new bill
app.post('/api/bills', async (req, res) => {
    try {
        const newBill = new Bill({
            userId: req.body.userId,
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

// --- 7. SLAB PREDICTOR API ---
app.post('/api/predict', (req, res) => {
    try {
        const { expectedUnits } = req.body;
        
        if (typeof expectedUnits !== 'number' || expectedUnits < 0) {
            return res.status(400).json({ message: "Invalid expected units" });
        }

        let cost = 0;
        const isSafe = expectedUnits <= 500;
        
        if (expectedUnits <= 500) {
            if (expectedUnits > 100) {
                const slab101to400 = Math.min(expectedUnits - 100, 300);
                cost += slab101to400 * 2.25;
            }
            if (expectedUnits > 400) {
                const slab401to500 = expectedUnits - 400;
                cost += slab401to500 * 4.50;
            }
        } else {
            if (expectedUnits > 100) {
                const slab101to400 = Math.min(expectedUnits - 100, 300);
                cost += slab101to400 * 4.50; 
            }
            if (expectedUnits > 400) {
                const slab401to500 = Math.min(expectedUnits - 400, 100);
                cost += slab401to500 * 6.00; 
            }
            if (expectedUnits > 500) {
                const slab501plus = expectedUnits - 500;
                cost += slab501plus * 8.00; 
            }
        }

        const bufferOrExcess = isSafe ? (500 - expectedUnits) : (expectedUnits - 500);

        res.json({
            cost: cost,
            status: isSafe ? "Safe Slab" : "Penalty Slab",
            difference: bufferOrExcess
        });

    } catch (error) {
        res.status(500).json({ message: "Server error during prediction", error: error.message });
    }
});

// --- 8. START SERVER ---
app.listen(PORT, () => {
    console.log(`⚡ PowerHouse server is running at http://localhost:${PORT}`);
});