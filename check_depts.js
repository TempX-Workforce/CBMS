const mongoose = require('mongoose');
const Department = require('./server/models/Department');
require('dotenv').config({ path: './server/.env' });

const checkDepartments = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const departments = await Department.find({});
        console.log('Current Departments:', departments.map(d => d.name));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkDepartments();
