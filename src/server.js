// src/server.js
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `API corriendo en http://localhost:${PORT} (modo: ${
      process.env.NODE_ENV || "production"
    })`
  );
});
