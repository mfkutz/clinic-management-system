import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentStatus = 'pending' | 'paid';

interface AppointmentAttributes {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  startDatetime: Date;
  endDatetime: Date;
  status: AppointmentStatus;
  notes: string | null;
  cancellationReason: string | null;
  amount: number | null;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  paidAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type AppointmentCreationAttributes = Optional<
  AppointmentAttributes,
  | 'id'
  | 'status'
  | 'notes'
  | 'cancellationReason'
  | 'amount'
  | 'paymentStatus'
  | 'paymentMethod'
  | 'paidAt'
  | 'createdAt'
  | 'updatedAt'
>;

export class Appointment
  extends Model<AppointmentAttributes, AppointmentCreationAttributes>
  implements AppointmentAttributes
{
  declare id: string;
  declare clientId: string;
  declare professionalId: string;
  declare serviceId: string;
  declare startDatetime: Date;
  declare endDatetime: Date;
  declare status: AppointmentStatus;
  declare notes: string | null;
  declare cancellationReason: string | null;
  declare amount: number | null;
  declare paymentStatus: PaymentStatus;
  declare paymentMethod: string | null;
  declare paidAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Appointment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    clientId: { type: DataTypes.UUID, allowNull: false, field: 'client_id' },
    professionalId: { type: DataTypes.UUID, allowNull: false, field: 'professional_id' },
    serviceId: { type: DataTypes.UUID, allowNull: false, field: 'service_id' },
    startDatetime: { type: DataTypes.DATE, allowNull: false, field: 'start_datetime' },
    endDatetime: { type: DataTypes.DATE, allowNull: false, field: 'end_datetime' },
    status: {
      type: DataTypes.ENUM('confirmed', 'cancelled', 'completed', 'no_show'),
      allowNull: false,
      defaultValue: 'confirmed',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    cancellationReason: { type: DataTypes.TEXT, allowNull: true, field: 'cancellation_reason' },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'payment_status',
    },
    paymentMethod: { type: DataTypes.STRING, allowNull: true, field: 'payment_method' },
    paidAt: { type: DataTypes.DATE, allowNull: true, field: 'paid_at' },
  },
  {
    sequelize,
    tableName: 'appointments',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['professional_id', 'start_datetime'] }],
  }
);
