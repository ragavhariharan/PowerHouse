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
        const userBills = await Bill.find({ userId: req.params.userId }).sort({ createdAt: -1 });
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

// Function to compute TNEB Slab Costs dynamically
function calculateTNEBCost(units) {
    let cost = 0;
    const isSafe = units <= 500;
    
    if (units <= 500) {
        if (units > 100) {
            const slab101to400 = Math.min(units - 100, 300);
            cost += slab101to400 * 2.25;
        }
        if (units > 400) {
            const slab401to500 = units - 400;
            cost += slab401to500 * 4.50;
        }
    } else {
        if (units > 100) {
            const slab101to400 = Math.min(units - 100, 300);
            cost += slab101to400 * 4.50; 
        }
        if (units > 400) {
            const slab401to500 = Math.min(units - 400, 100);
            cost += slab401to500 * 6.00; 
        }
        if (units > 500) {
            const slab501plus = units - 500;
            cost += slab501plus * 8.00; 
        }
    }

    return {
        cost: cost,
        isSafe: isSafe,
        difference: isSafe ? (500 - units) : (units - 500)
    };
}

// POST new bill
app.post('/api/bills', async (req, res) => {
    try {
        const { userId, month, units } = req.body;
        
        if (typeof units !== 'number' || units < 0) {
            return res.status(400).json({ message: "Invalid consumed units" });
        }

        const calculated = calculateTNEBCost(units);

        const newBill = new Bill({
            userId: userId,
            month: month,
            cost: calculated.cost,
            units: units
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

        const calculated = calculateTNEBCost(expectedUnits);

        res.json({
            cost: calculated.cost,
            status: calculated.isSafe ? "Safe Slab" : "Penalty Slab",
            difference: calculated.difference
        });

    } catch (error) {
        res.status(500).json({ message: "Server error during prediction", error: error.message });
    }
});

// --- 8. START SERVER ---
app.listen(PORT, () => {
    console.log(`⚡ PowerHouse server is running at http://localhost:${PORT}`);
});