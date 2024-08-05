const { Schema, model } = require("mongoose");
const NotesSchema = Schema({
  userId: {
    type: Schema.Types.ObjectId,
  },
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isShareable: {
    type: Boolean,
  },
});
// const UserModel = model("User", UserSchema);

const NotesModel = model("Note", NotesSchema);
module.exports = NotesModel;
