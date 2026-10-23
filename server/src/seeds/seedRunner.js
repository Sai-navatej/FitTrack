require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const Exercise = require('../models/Exercise');
const { predefinedExercises } = require('./exerciseSeeds');

const seedExercises = async () => {
  try {
    const existingCount = await Exercise.countDocuments({ user: null });
    if (existingCount === 0) {
      console.log('Seeding initial predefined exercises into database...');
      await Exercise.insertMany(predefinedExercises);
      console.log(`✅ Successfully seeded ${predefinedExercises.length} predefined exercises!`);
    } else {
      console.log(`ℹ️ Predefined exercises already present (${existingCount} found). Updating/upserting missing exercises...`);
      for (const ex of predefinedExercises) {
        await Exercise.findOneAndUpdate(
          { name: ex.name, user: null },
          { $set: ex },
          { upsert: true, new: true }
        );
      }
      console.log('✅ Predefined exercises synchronization complete.');
    }
  } catch (error) {
    console.error('Error seeding exercises:', error.message);
  }
};

// Standalone execution
if (require.main === module) {
  (async () => {
    await connectDB();
    await seedExercises();
    await disconnectDB();
    process.exit(0);
  })();
}

module.exports = { seedExercises };
