import mongoose, { Schema, models } from 'mongoose'

const ExpenseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    category: {
      type: String,
      required: true,
      enum: [
        'Groceries',
        'WiFi',
        'Electricity',
        'Rent',
        'Cleaning',
        'Kitchen',
        'Maintenance',
        'Other',
      ],
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
    },

    // ✅ PURE CALENDAR DATE
    // Format: yyyy-MM-dd
    date: {
      type: String,
      required: true,
    },

    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
)

export const Expense =
  models.Expense || mongoose.model('Expense', ExpenseSchema)
