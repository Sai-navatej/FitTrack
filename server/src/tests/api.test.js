const dns = require('node:dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const { app } = require('../index');
const { seedExercises } = require('../seeds/seedRunner');
const Exercise = require('../models/Exercise');

let mongoServer;
let user1Token;
let user1Id;
let user2Token;
let user2Id;

describe('FitTrack API Comprehensive End-to-End Test Suite', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';

    let uri = process.env.TEST_MONGODB_URI;
    if (!uri && process.env.MONGODB_URI) {
      try {
        const parsed = new URL(process.env.MONGODB_URI);
        parsed.pathname = '/fittrack_test';
        uri = parsed.toString();
      } catch (err) {
        uri = process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/fittrack_test$1');
      }
    }

    if (uri && !process.env.USE_IN_MEMORY_DB) {
      try {
        console.log('Connecting test runner to isolated MongoDB Atlas test database (fittrack_test)...');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
        console.log(`Connected test database: ${mongoose.connection.name}`);
      } catch (connErr) {
        console.warn('Could not connect to Atlas test database, falling back to MongoMemoryServer for tests:', connErr.message);
        mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
        await mongoose.connect(uri);
      }
    } else {
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      await mongoose.connect(uri);
    }
    await seedExercises();
  });

  after(async () => {
    if (mongoose.connection && mongoose.connection.name === 'fittrack_test') {
      try {
        await mongoose.connection.dropDatabase();
      } catch (err) {
        console.warn('Could not drop test database:', err.message);
      }
    }
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  // 1. Health check
  test('GET /api/health should return status healthy', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'healthy');
  });

  // 2. Authentication: Registration
  test('POST /api/auth/register should register user 1 with full fitness profile', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Alex Mercer',
        email: 'alex@example.com',
        password: 'Password123!',
        age: 26,
        height: 178,
        currentWeight: 75.5,
        weightUnit: 'kg',
        fitnessGoal: 'muscle_gain',
        preferredSplit: 'ppl',
        dailyCalorieTarget: 2600,
        dailyWaterTarget: 3000,
      });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, 'alex@example.com');
    assert.strictEqual(res.body.user.currentWeight, 75.5);
    user1Token = res.body.token;
    user1Id = res.body.user._id;
  });

  test('POST /api/auth/register should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Alex Clone',
        email: 'alex@example.com',
        password: 'Password123!',
        age: 26,
        height: 178,
        currentWeight: 75,
      });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/auth/register should register user 2 for multi-tenant isolation testing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Sarah Connor',
        email: 'sarah@example.com',
        password: 'SecretPassword99!',
        age: 29,
        height: 168,
        currentWeight: 62.0,
        weightUnit: 'kg',
        fitnessGoal: 'fat_loss',
        preferredSplit: 'upper_lower',
        dailyCalorieTarget: 1800,
        dailyWaterTarget: 2500,
      });

    assert.strictEqual(res.statusCode, 201);
    user2Token = res.body.token;
    user2Id = res.body.user._id;
  });

  // 3. Authentication: Login & Current User
  test('POST /api/auth/login should authenticate user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex@example.com',
        password: 'Password123!',
      });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.fullName, 'Alex Mercer');
  });

  test('POST /api/auth/login should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex@example.com',
        password: 'WrongPassword!',
      });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('GET /api/auth/me should fetch profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.user.email, 'alex@example.com');
  });

  test('GET /api/auth/me should fail without token', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.strictEqual(res.statusCode, 401);
  });

  // 4. Workout Splits & Exercise Library
  test('GET /api/workouts/splits should return predefined splits', async () => {
    const res = await request(app)
      .get('/api/workouts/splits')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.predefinedSplits.ppl);
    assert.ok(res.body.predefinedSplits.upper_lower);
    assert.strictEqual(res.body.currentSplit, 'ppl');
  });

  // Custom Split Tests
  test('PUT /api/workouts/splits should save a custom split with routine name, days, muscle groups, and exercises', async () => {
    const res = await request(app)
      .put('/api/workouts/splits')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        preferredSplit: 'custom',
        customSplit: {
          routineName: 'My PPL Variant',
          days: [
            {
              name: 'Push Day',
              muscleGroups: ['chest', 'shoulders', 'triceps'],
              exercises: ['Barbell Bench Press', 'Shoulder Press', 'Triceps Pushdowns'],
            },
            {
              name: 'Pull Day',
              muscleGroups: ['back', 'biceps'],
              exercises: ['Pull-ups', 'Dumbbell Bicep Curls'],
            },
            {
              name: 'Leg Day',
              muscleGroups: ['legs'],
              exercises: ['Barbell Squats', 'Romanian Deadlifts'],
            },
          ],
        },
      });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.preferredSplit, 'custom');
    assert.strictEqual(res.body.customSplit.routineName, 'My PPL Variant');
    assert.strictEqual(res.body.customSplit.days.length, 3);
    assert.strictEqual(res.body.customSplit.days[0].name, 'Push Day');
    assert.deepStrictEqual(res.body.customSplit.days[0].muscleGroups, ['chest', 'shoulders', 'triceps']);
    assert.strictEqual(res.body.customSplit.days[0].exercises.length, 3);
  });

  test('GET /api/workouts/splits should return saved custom split after saving', async () => {
    const res = await request(app)
      .get('/api/workouts/splits')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.currentSplit, 'custom');
    assert.ok(res.body.customSplit);
    assert.strictEqual(res.body.customSplit.routineName, 'My PPL Variant');
    assert.strictEqual(res.body.customSplit.days.length, 3);
  });

  test('GET /api/workouts/splits for user 2 should NOT contain user 1 custom split', async () => {
    const res = await request(app)
      .get('/api/workouts/splits')
      .set('Authorization', `Bearer ${user2Token}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.currentSplit, 'upper_lower');
    // User 2 should have no custom split or an empty one
    const hasCustomDays = res.body.customSplit && res.body.customSplit.days && res.body.customSplit.days.length > 0;
    assert.strictEqual(hasCustomDays, false, 'User 2 must not see user 1 custom split data');
  });

  test('PUT /api/workouts/splits should reject custom split with empty routine name', async () => {
    const res = await request(app)
      .put('/api/workouts/splits')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        preferredSplit: 'custom',
        customSplit: {
          routineName: '',
          days: [{ name: 'Day 1', muscleGroups: [], exercises: [] }],
        },
      });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
  });

  test('PUT /api/workouts/splits should reject custom split with no days', async () => {
    const res = await request(app)
      .put('/api/workouts/splits')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        preferredSplit: 'custom',
        customSplit: {
          routineName: 'Empty Routine',
          days: [],
        },
      });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
  });

  test('PUT /api/workouts/splits should reject custom split with unnamed day', async () => {
    const res = await request(app)
      .put('/api/workouts/splits')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        preferredSplit: 'custom',
        customSplit: {
          routineName: 'Bad Routine',
          days: [{ name: '', muscleGroups: [], exercises: [] }],
        },
      });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
  });

  test('PUT /api/workouts/splits should allow switching back to predefined split without losing custom data', async () => {
    const res = await request(app)
      .put('/api/workouts/splits')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ preferredSplit: 'ppl' });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.preferredSplit, 'ppl');
    // Custom split data should still be persisted
    assert.ok(res.body.customSplit);
    assert.strictEqual(res.body.customSplit.routineName, 'My PPL Variant');
    assert.strictEqual(res.body.customSplit.days.length, 3);
  });

  test('GET /api/exercises should return predefined exercises', async () => {
    const res = await request(app)
      .get('/api/exercises')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.exercises.length > 15);
    const benchPress = res.body.exercises.find((e) => e.name === 'Barbell Bench Press');
    assert.ok(benchPress, 'Barbell Bench Press must exist in library');
    assert.strictEqual(benchPress.targetMuscleGroup, 'chest');
  });

  test('POST /api/exercises should allow user to create custom exercise', async () => {
    const res = await request(app)
      .post('/api/exercises')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Incline Cable Fly',
        targetMuscleGroup: 'chest',
        category: 'hypertrophy',
        equipmentRequired: 'cable',
        instructions: 'Set low cables and fly upward.',
      });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.exercise.name, 'Incline Cable Fly');
    assert.strictEqual(res.body.exercise.isCustom, true);
  });

  // 5. Workout Logging & History
  let createdWorkoutId;
  test('POST /api/workouts should save completed workout session with sets, reps, and weights', async () => {
    const res = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Push Day 1',
        splitType: 'ppl',
        date: new Date().toISOString(),
        durationMinutes: 45,
        exercises: [
          {
            name: 'Barbell Bench Press',
            targetMuscleGroup: 'chest',
            isBodyweight: false,
            sets: [
              { setNumber: 1, reps: 10, weight: 60, completed: true },
              { setNumber: 2, reps: 8, weight: 70, completed: true },
              { setNumber: 3, reps: 6, weight: 80, completed: true },
            ],
          },
          {
            name: 'Push-ups',
            targetMuscleGroup: 'chest',
            isBodyweight: true,
            sets: [
              { setNumber: 1, reps: 15, weight: 0, completed: true },
              { setNumber: 2, reps: 12, weight: 0, completed: true },
            ],
          },
        ],
        notes: 'Great chest workout, felt strong on bench press!',
      });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.workout._id);
    // Bench volume: (10*60) + (8*70) + (6*80) = 600 + 560 + 480 = 1640 kg
    assert.strictEqual(res.body.workout.totalVolume, 1640);
    createdWorkoutId = res.body.workout._id;
  });

  test('GET /api/workouts should return workout in user history', async () => {
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.workouts.length, 1);
    assert.strictEqual(res.body.workouts[0].title, 'Push Day 1');
  });

  // Multi-tenant protection: User 2 cannot access or delete User 1's workout!
  test('GET /api/workouts/:id should forbid user 2 from accessing user 1 workout', async () => {
    const res = await request(app)
      .get(`/api/workouts/${createdWorkoutId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    assert.strictEqual(res.statusCode, 403);
  });

  test('DELETE /api/workouts/:id should forbid user 2 from deleting user 1 workout', async () => {
    const res = await request(app)
      .delete(`/api/workouts/${createdWorkoutId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    assert.strictEqual(res.statusCode, 403);
  });

  // 6. Calorie & Food Tracking
  let foodEntryId;
  test('POST /api/nutrition should log a food item with macros', async () => {
    const res = await request(app)
      .post('/api/nutrition')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Chicken Breast with Brown Rice',
        mealCategory: 'lunch',
        servingQuantity: '200g chicken + 1 cup rice',
        calories: 548,
        protein: 66,
        carbs: 45,
        fat: 8,
      });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.foodEntry.calories, 548);
    foodEntryId = res.body.foodEntry._id;
  });

  test('GET /api/nutrition should return food entries and accurate calculated daily totals', async () => {
    const res = await request(app)
      .get('/api/nutrition')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.entries.length, 1);
    assert.strictEqual(res.body.totals.calories, 548);
    assert.strictEqual(res.body.totals.protein, 66);
    assert.strictEqual(res.body.targetCalories, 2600);
    assert.strictEqual(res.body.remainingCalories, 2600 - 548);
  });

  // 7. Weight Tracking
  test('POST /api/weight should add a new measurement and update user current weight', async () => {
    const res = await request(app)
      .post('/api/weight')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        weight: 76.0,
        unit: 'kg',
        notes: 'Morning weigh-in after push day',
      });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.measurement.weight, 76.0);
  });

  test('GET /api/weight should return history and difference from previous', async () => {
    const res = await request(app)
      .get('/api/weight')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.measurements.length, 2); // Initial registration weight + new weight
    assert.strictEqual(res.body.currentWeight, 76.0);
    assert.strictEqual(res.body.latestDifference, 0.5); // 76.0 - 75.5 = +0.5 kg
  });

  // 8. Water Intake Tracking
  test('POST /api/water should log water intake', async () => {
    const res = await request(app)
      .post('/api/water')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        amountMl: 500,
      });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.entry.amountMl, 500);
  });

  test('GET /api/water/daily should return consumed and remaining water', async () => {
    const res = await request(app)
      .get('/api/water/daily')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.totalConsumedMl, 500);
    assert.strictEqual(res.body.targetMl, 3000);
    assert.strictEqual(res.body.remainingMl, 2500);
  });

  // 9. Water Reminder Preferences Persistence
  test('PUT /api/users/reminder-preferences should update reminder interval and waking hours', async () => {
    const res = await request(app)
      .put('/api/users/reminder-preferences')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        enabled: true,
        intervalMinutes: 90,
        wakingHourStart: 7,
        wakingHourEnd: 23,
      });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.reminderPreferences.intervalMinutes, 90);
    assert.strictEqual(res.body.reminderPreferences.wakingHourStart, 7);
  });

  // 10. Progress & Dashboard Analytics
  test('GET /api/progress/dashboard should aggregate live database numbers', async () => {
    const res = await request(app)
      .get('/api/progress/dashboard')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.totalWorkouts, 1);
    assert.strictEqual(res.body.data.caloriesConsumedToday, 548);
    assert.strictEqual(res.body.data.waterConsumedToday, 500);
    assert.strictEqual(res.body.data.currentWeight, 76.0);
  });

  test('GET /api/progress/strength should return progression data for Barbell Bench Press', async () => {
    const res = await request(app)
      .get('/api/progress/strength?exerciseName=Barbell Bench Press')
      .set('Authorization', `Bearer ${user1Token}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.length, 1);
    assert.strictEqual(res.body.data[0].maxWeight, 80);
  });
});
