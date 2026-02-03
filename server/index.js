const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
//connect to database
const pool = require("./db");

app.get("/api", (req, res) => {
  res.send("Hello, API!");
});

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tbproducts ORDER BY product_id ASC",
    );
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM tbproducts WHERE product_id=$1",
      [id],
    );
    if (result.rows.length > 0) {
      res.json({
        success: true,
        data: result.rows[0],
      });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  const {
    product_name,
    product_price,
    product_description,
    product_image,
    product_quantity,
  } = req.body;
  const queryText = `INSERT INTO tbproducts (product_name, product_price, product_description, product_image, product_quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  const values = [
    product_name,
    product_price,
    product_description,
    product_image,
    product_quantity,
  ];
  try {
    const result = await pool.query(queryText, values);
    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    //
    if (err.code === "23505") {
      res.status(409).json({ error: "duplicate product_name" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const {
    product_name,
    product_price,
    product_description,
    product_image,
    product_quantity,
  } = req.body;

  const queryText = `UPDATE tbproducts SET product_name=$1, product_price=$2, product_description=$3, product_image=$4, product_quantity=$5 WHERE product_id=$6 RETURNING *`;
  const values = [
    product_name,
    product_price,
    product_description,
    product_image,
    product_quantity,
    id,
  ];
  try {
    const result = await pool.query(queryText, values);
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const queryText = `DELETE FROM tbproducts WHERE product_id=$1 RETURNING *`;
  try {
    const result = await pool.query(queryText, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Product not found" });
    } else {
      res.json({
        success: true,
        data: result.rows[0],
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/register", async (req, res) => {
  const { user_name, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10); // เข้ารหัส 10 รอบ

  try {
    const result = await pool.query(
      `INSERT INTO tbusers (user_name, password, role) VALUES ($1, $2, $3) RETURNING user_id, user_name, role`,
      [user_name, hashedPassword, role],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Register failed");
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tbusers ORDER BY user_id ASC",
    );
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM tbusers WHERE user_id=$1", [
      id,
    ]);
    if (result.rows.length > 0) {
      res.json({
        success: true,
        data: result.rows[0],
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { user_name, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM tbusers WHERE user_name=$1",
      [user_name],
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.user_id }, "YOUR_SECRET_KEY", {
      expiresIn: "1h",
    });
    res.json({
      success: true,
      data: {
        user_id: user.user_id,
        user_name: user.user_name,
        role: user.role,
        token: token,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

module.exports = app;
