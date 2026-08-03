import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface AvailabilityExceptionAttributes {
  id: string;
  professionalId: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string | null;
  endTime: string | null;
  isBlocked: boolean;
}

type AvailabilityExceptionCreationAttributes = Optional<
  AvailabilityExceptionAttributes,
  'id' | 'startTime' | 'endTime'
>;

export class AvailabilityException
  extends Model<AvailabilityExceptionAttributes, AvailabilityExceptionCreationAttributes>
  implements AvailabilityExceptionAttributes
{
  declare id: string;
  declare professionalId: string;
  declare date: string;
  declare startTime: string | null;
  declare endTime: string | null;
  declare isBlocked: boolean;
}

AvailabilityException.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    professionalId: { type: DataTypes.UUID, allowNull: false, field: 'professional_id' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    startTime: { type: DataTypes.TIME, allowNull: true, field: 'start_time' },
    endTime: { type: DataTypes.TIME, allowNull: true, field: 'end_time' },
    isBlocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_blocked' },
  },
  {
    sequelize,
    tableName: 'availability_exceptions',
    underscored: true,
    timestamps: true,
  }
);
