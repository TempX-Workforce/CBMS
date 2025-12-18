const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string
// Update this if your MongoDB is running on a different host/port
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cbms';

// Admin user credentials
const ADMIN_EMAIL = 'xyz@gmail.com';
const ADMIN_PASSWORD = 'abc123..';

// Define User Schema (minimal version for seeding)
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'office', 'vice_principal', 'principal', 'auditor', 'hod', 'department'],
        default: 'department',
    },
    name: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB successfully!');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);
            await mongoose.connection.close();
            return;
        }

        // Hash the password
        console.log('Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

        // Create admin user
        console.log('Creating admin user...');
        const adminUser = new User({
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin',
            name: 'System Administrator',
            isActive: true,
        });

        await adminUser.save();

        console.log('\n✅ Admin user created successfully!');
        console.log('-----------------------------------');
        console.log('Email:', ADMIN_EMAIL);
        console.log('Password:', ADMIN_PASSWORD);
        console.log('Role: admin');
        console.log('-----------------------------------');
        console.log('\nYou can now login with these credentials.');

        // Close the connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    } catch (error) {
        console.error('\n❌ Error creating admin user:', error.message);
        if (error.code === 11000) {
            console.error('User with this email already exists.');
        }
        process.exit(1);
    }
}

// Run the script
createAdminUser();
