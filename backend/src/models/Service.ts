import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export const SERVICE_CATEGORIES = ['Consulta', 'Estética', 'Ortodoncia', 'Cirugía', 'Prevención'] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

interface ServiceAttributes {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  category: ServiceCategory;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type ServiceCreationAttributes = Optional<
  ServiceAttributes,
  'id' | 'description' | 'active' | 'createdAt' | 'updatedAt'
>;

export class Service extends Model<ServiceAttributes, ServiceCreationAttributes> implements ServiceAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare durationMinutes: number;
  declare price: number;
  declare category: ServiceCategory;
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Service.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: false, field: 'duration_minutes' },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    category: { type: DataTypes.ENUM(...SERVICE_CATEGORIES), allowNull: false, defaultValue: 'Consulta' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'services',
    underscored: true,
    timestamps: true,
  }
);
