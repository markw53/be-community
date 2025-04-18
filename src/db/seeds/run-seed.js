import seed from './seed.js';
import db from '../../db/connection.js';
import testData from '../data/test-data/index.js';

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