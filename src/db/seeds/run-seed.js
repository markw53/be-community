const seed = require('./seed');
const db = require('../../db/connection');
const testData = require('../data/test-data');

const runSeed = async () => {
  try {
    await seed(testData);
    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await db.end();
  }
};

runSeed();