const mongoose = require('mongoose');
const Department = require('./models/Department');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const departments = [
    { name: 'Computer Science and Engineering', code: 'CSE' },
    { name: 'Artificial Intelligence and Data Science', code: 'AI&DS' },
    { name: 'Artificial Intelligence and Machine Learning', code: 'AI&ML' },
    { name: 'Electronics and Communication Engineering', code: 'ECE' },
    { name: 'Electrical and Electronics Engineering', code: 'EEE' },
    { name: 'Mechanical Engineering', code: 'MECH' },
    { name: 'Civil Engineering', code: 'CIVIL' },
    { name: 'Information Technology', code: 'IT' }
];

const seedDepartments = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const dept of departments) {
            const existing = await Department.findOne({ code: dept.code });
            if (!existing) {
                await Department.create(dept);
                console.log(`Created department: ${dept.name}`);
            } else {
                console.log(`Department already exists: ${dept.name}`);
            }
        }

        console.log('Seeding completed');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding departments:', error);
        process.exit(1);
    }
};

seedDepartments();
