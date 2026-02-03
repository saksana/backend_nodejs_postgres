const { Pool } = require("pg");
const bcrypt = require("bcrypt");

// set up connection pool
const pool = new Pool({
  user: "postgres", // Username database
  host: "localhost",
  database: "postgres",
  password: "12345678",
  port: 5432, // Port default PostgreSQL
});

const createTableProduct = async () => {
  const queryText = `
CREATE TABLE IF NOT EXISTS tbproducts (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) UNIQUE NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    product_description TEXT,
    product_image VARCHAR(255),
    product_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;

  try {
    await pool.query(queryText);
    console.log("Table 'tbproduct' created or already exists.");
  } catch (error) {
    console.error("Error creating table 'tbproduct':", error);
  }
};
const createTableUser = async () => {
  const queryText = `
CREATE TABLE IF NOT EXISTS tbusers (
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL, -- เก็บแบบ Hashed เท่านั้น!
    role VARCHAR(20) DEFAULT 'user', -- 'admin' หรือ 'user'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;
  try {
    const result = await pool.query(queryText);
    console.log("Table 'tbusers' already exists.");
    console.log("Table 'tbusers' created or already exists.");
  } catch (error) {
    console.error("Error creating table 'tbusers':", error);
  }
};

const addAdmin = async () => {
  // add default admin user
  const username = "admin",
    password = "1234",
    role = "admin";
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO tbusers (user_name, password, role) VALUES ($1, $2, $3) ON CONFLICT (user_name) DO NOTHING",
    [
      username,
      hashedPassword, // hashed password
      role,
    ],
  );
};
createTableProduct();
createTableUser();
addAdmin();
module.exports = pool;
