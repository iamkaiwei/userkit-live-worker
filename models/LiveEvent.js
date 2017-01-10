var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schemaOptions = {};

var LiveEventSchema = new Schema({
  project_id: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  hour: { type: Number, required: true},
  date: { type: String, required: true },
  data: { type: Schema.Types.Mixed }
}, schemaOptions);

var LiveEvent = mongoose.model('LiveEvent', LiveEventSchema);

module.exports = LiveEvent;
