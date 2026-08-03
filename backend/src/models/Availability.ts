import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface AvailabilityAttributes {
  id: string;
  professionalId: string;
  dayOfWeek: number; // 0 = domingo ... 6 = sábado
  startTime: string; // 'HH:mm:ss'
  endTime: string;
}

type AvailabilityCreationAttributes = Optional<AvailabilityAttributes, 'id'>;

export class Availability
  extends Model<AvailabilityAttributes, AvailabilityCreationAttributes>
  implements AvailabilityAttributes
{
  declare id: string;
  declare professionalId: string;
  declare dayOfWeek: number;
  declare startTime: string;
  declare endTime: string;
}

Availability.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    professionalId: { type: DataTypes.UUID, allowNull: false, field: 'professional_id' },
    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'day_of_week',
      validate: { min: 0, max: 6 },
    },
    startTime: { type: DataTypes.TIME, allowNull: false, field: 'start_time' },
    endTime: { type: DataTypes.TIME, allowNull: false, field: 'end_time' },
  },
  {
    sequelize,
    tableName: 'availabilities',
    underscored: true,
    timestamps: true,
  }
);
