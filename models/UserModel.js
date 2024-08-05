const { Schema, model } = require("mongoose");
const UserSchema = Schema({
  //   id: Schema.ObjectId,
  name: {
    type: String,
    required: true,
  },
  email: { type: String, required: true },
  password: { type: String, required: true, unique: true },
});
const UserModel = model("User", UserSchema);
module.exports = UserModel;
