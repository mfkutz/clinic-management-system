import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProfessionalAttributes {
  id: string;
  userId: string;
  specialty: string | null;
  bio: string | null;
  color: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type ProfessionalCreationAttributes = Optional<
  ProfessionalAttributes,
  'id' | 'specialty' | 'bio' | 'active' | 'createdAt' | 'updatedAt'
>;

export class Professional
  extends Model<ProfessionalAttributes, ProfessionalCreationAttributes>
  implements ProfessionalAttributes
{
  declare id: string;
  declare userId: string;
  declare specialty: string | null;
  declare bio: string | null;
  declare color: string;
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Professional.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'user_id' },
    specialty: { type: DataTypes.STRING, allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    color: { type: DataTypes.STRING, allowNull: false, defaultValue: '#4f46e5' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'professionals',
    underscored: true,
    timestamps: true,
  }
);
