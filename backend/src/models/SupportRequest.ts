import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type SupportRequestStatus = 'open' | 'closed';

interface SupportRequestAttributes {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: SupportRequestStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

type SupportRequestCreationAttributes = Optional<
  SupportRequestAttributes,
  'id' | 'status' | 'createdAt' | 'updatedAt'
>;

export class SupportRequest
  extends Model<SupportRequestAttributes, SupportRequestCreationAttributes>
  implements SupportRequestAttributes
{
  declare id: string;
  declare userId: string;
  declare subject: string;
  declare message: string;
  declare status: SupportRequestStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SupportRequest.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    subject: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM('open', 'closed'),
      allowNull: false,
      defaultValue: 'open',
    },
  },
  {
    sequelize,
    tableName: 'support_requests',
    underscored: true,
    timestamps: true,
  }
);
