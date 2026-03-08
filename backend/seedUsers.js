const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding...");

    const password = "123456";
    const hashedPassword = await bcrypt.hash(password, 10);

    const usersToSeed = [
      {
        name: "Bino",
        email: "bino@app.com",
        password: hashedPassword,
        role: "user",
      },
      {
        name: "Bijin",
        email: "bijin@app.com",
        password: hashedPassword,
        role: "admin",
      },
      {
        name: "Savio",
        email: "savio@app.com",
        password: hashedPassword,
        role: "worker",
      },
    ];

    for (const userData of usersToSeed) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating role and password...`);
        existingUser.password = userData.password;
        existingUser.role = userData.role;
        existingUser.name = userData.name;
        await existingUser.save();
      } else {
        const newUser = new User(userData);
        await newUser.save();
        console.log(`User ${userData.email} created.`);
      }
    }

    console.log("Users seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
};

seedUsers();
