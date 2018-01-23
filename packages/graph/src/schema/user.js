const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const validator = require('validator');
const shortid = require('shortid');
const crypto = require('crypto');

const { Schema } = mongoose;

const schema = new Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    default: shortid.generate,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    validate: [
      {
        validator(email) {
          return validator.isEmail(email);
        },
      },
    ],
  },
  givenName: {
    type: String,
    required: true,
    trim: true,
  },
  familyName: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  logins: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastLoggedInAt: {
    type: Date,
  },
  isEmailVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  role: {
    type: String,
    default: 'Member',
    required: true,
    enum: ['Member', 'Admin'],
  },
  photoURL: {
    type: String,
  }
}, {
  // @todo Shouldn't be used in production!
  autoIndex: true,
  timestamps: true,
});

/**
 * Indexes
 */
schema.index({ email: 1, isEmailVerified: 1 });

/**
 * Hooks.
 */
schema.pre('save', function setPassword(next) {
  if (!this.isModified('password')) {
    next();
  } else {
    bcrypt.hash(this.password, 13).then((hash) => {
      this.password = hash;
      next();
    }).catch(next);
  }
});
schema.pre('save', function setPhotoURL(next) {
  if (!this.photoURL) {
    const hash = crypto.createHash('md5').update(this.email).digest('hex');
    this.photoURL = `https://www.gravatar.com/avatar/${hash}`;
    next();
  }
})

module.exports = schema;
