import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ClinicalRecordAttributes {
  id: string;
  patientId: string;
  professionalId: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type ClinicalRecordCreationAttributes = Optional<ClinicalRecordAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class ClinicalRecord
  extends Model<ClinicalRecordAttributes, ClinicalRecordCreationAttributes>
  implements ClinicalRecordAttributes
{
  declare id: string;
  declare patientId: string;
  declare professionalId: string;
  declare content: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ClinicalRecord.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    professionalId: { type: DataTypes.UUID, allowNull: false, field: 'professional_id' },
    content: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    sequelize,
    tableName: 'clinical_records',
    underscored: true,
    timestamps: true,
  }
);
