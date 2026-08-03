import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProfessionalServiceAttributes {
  id: string;
  professionalId: string;
  serviceId: string;
  priceOverride: number | null;
  durationOverride: number | null;
}

type ProfessionalServiceCreationAttributes = Optional<
  ProfessionalServiceAttributes,
  'id' | 'priceOverride' | 'durationOverride'
>;

export class ProfessionalService
  extends Model<ProfessionalServiceAttributes, ProfessionalServiceCreationAttributes>
  implements ProfessionalServiceAttributes
{
  declare id: string;
  declare professionalId: string;
  declare serviceId: string;
  declare priceOverride: number | null;
  declare durationOverride: number | null;
}

ProfessionalService.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    professionalId: { type: DataTypes.UUID, allowNull: false, field: 'professional_id' },
    serviceId: { type: DataTypes.UUID, allowNull: false, field: 'service_id' },
    priceOverride: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'price_override' },
    durationOverride: { type: DataTypes.INTEGER, allowNull: true, field: 'duration_override' },
  },
  {
    sequelize,
    tableName: 'professional_services',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['professional_id', 'service_id'] }],
  }
);
