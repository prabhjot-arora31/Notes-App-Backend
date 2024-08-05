const mongoose = require("mongoose");
mongoose
  .connect(process.env.mongo_uri)
  .then((ele) => {
    console.log("connected to mongodb");
  })
  .catch((err) => {
    console.log("error while connnecting mongodb:", err.message);
  });
module.exports = mongoose;
