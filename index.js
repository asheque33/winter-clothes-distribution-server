const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
// app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("wc-project");
    const userCollection = db.collection("users");
    const winterClothesCollection = db.collection("winter-clothes");
    const donationsCollection = db.collection("donations");
    const communityCommentsCollection = db.collection("comments");
    const testimonialsCollection = db.collection("testimonials");
    const volunteersCollection = db.collection("volunteers");

    // User Registration
    app.post("/api/auth/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await userCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await userCollection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/auth/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await userCollection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    app.post("/dashboard/create-winter-clothes", async (req, res) => {
      const { image, category, title, size, description } = req.body;
      const result = await winterClothesCollection.insertOne({
        image,
        category,
        title,
        size,
        description,
      });
      if (result) {
        res.status(201).json({
          success: true,
          message: "Winter CLothes created successfully",
          data: req.body,
        });
      }
    });
    // get Winter Clothes collection from 'winter-clothes' server collection
    app.get("/winter-clothes", async (req, res) => {
      const result = await winterClothesCollection.find().toArray();
      res.status(200).json({
        success: true,
        message: "Winter clothes retrieved successfully",
        data: result,
      });
    });
    app.get("/winter-clothes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await winterClothesCollection.findOne(query);
      res.status(200).json({
        success: true,
        message: "Winter cloth retrieved successfully",
        data: result,
      });
    });
    app.patch("/winter-clothes/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedCloth = {
        $set: {
          image: data.image,
          title: data.title,
          category: data.category,
          size: data.size,
          description: data.description,
        },
      };
      const result = await winterClothesCollection.updateOne(
        query,
        updatedCloth,
        options
      );
      res.status(200).json({
        success: true,
        message: "Winter cloth updated successfully",
        data: result,
      });
    });
    app.delete("/winter-clothes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await winterClothesCollection.deleteOne(query);
      res.status(200).json({
        success: true,
        message: "Winter cloth deleted successfully",
        data: result,
      });
    });
    // Donors list from Donations collection
    app.get("/leaderboard", async (req, res) => {
      const result = await donationsCollection.find().toArray();
      res.status(200).json({
        success: true,
        message: "Donors retrieved successfully",
        data: result,
      });
    });
    // Create comments posted by the user
    app.post("/comment", async (req, res) => {
      const { name, comment } = req.body;
      const result = await communityCommentsCollection.insertOne({
        name,
        comment,
      });
      if (result) {
        res.status(201).json({
          success: true,
          message: "Comment created successfully",
          data: req.body,
        });
      }
    });
    // Get comments posted by the user
    app.get("/comments", async (req, res) => {
      const result = await communityCommentsCollection.find().toArray();
      res.status(200).json({
        success: true,
        message: "Comments retrieved successfully",
        data: result,
      });
    });
    // Create Testimonial posted by the donor
    app.post("/dashboard/create-testimonial", async (req, res) => {
      const { name, testimonial } = req.body;
      const result = await testimonialsCollection.insertOne({
        name,
        testimonial,
      });
      if (result) {
        res.status(201).json({
          success: true,
          message: "Testimonial created successfully",
          data: req.body,
        });
      }
    });
    // Get testimonials posted by the donors
    app.get("/testimonials", async (req, res) => {
      const result = await testimonialsCollection.find().toArray();
      res.status(200).json({
        success: true,
        message: "Testimonials retrieved successfully",
        data: result,
      });
    });
    // Get volunteers posted by the users
    app.get("/volunteers", async (req, res) => {
      const result = await volunteersCollection.find().toArray();
      res.status(200).json({
        success: true,
        message: "Volunteers retrieved successfully",
        data: result,
      });
    });
    // Create Volunteer posted by the user
    app.post("/volunteer", async (req, res) => {
      const { email, phoneNumber, location } = req.body;
      const result = await volunteersCollection.insertOne({
        email,
        phoneNumber,
        location,
      });
      if (result) {
        res.status(201).json({
          success: true,
          message: "Volunteer created successfully",
          data: req.body,
        });
      }
    });

    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
