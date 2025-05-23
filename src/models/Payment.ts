import { Column, DataType, Model, Table, CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

@Table({
  tableName: 'payments',
  timestamps: true,
})
export class Payment extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string; //// Primary key, UUID

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'customer_name',
  })
  customerName!: string;  // Customer's name

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
    field: 'customer_email',
  })
  customerEmail!: string; // Customer's email

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount!: number; // Payment amount

  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatus)),
    allowNull: false,
    defaultValue: PaymentStatus.PENDING,
  })
  status!: PaymentStatus; //// Payment status

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
    field: 'paymentReference',
  })
  paymentReference!: string;  // Unique payment reference from Paystack

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'authorization_url',
  })
  authorizationUrl?: string;  // URL for payment authorization

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'access_code',
  })
  accessCode?: string; // Access code from Paystack

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt!: Date;  // Record creation timestamp

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt!: Date; // Record update timestamp
}
