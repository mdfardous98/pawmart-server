const express = require("express");
const cors = require("cors");
const app = express();

const port = process.env.PORT || 3000;




// Middleware
app.use(cors());
app.use(express.json());


// Test route
app.get("/", (req, res) => {
    res.send("PawMart Server is running!");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});