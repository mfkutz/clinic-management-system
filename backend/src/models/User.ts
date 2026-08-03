import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type UserRole = 'admin' | 'professional' | 'client';

interface UserAttributes {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'phone' | 'active' | 'createdAt' | 'updatedAt'>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare phone: string | null;
  declare role: UserRole;
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING, allowNull: false, field: 'password_hash' },
    phone: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.ENUM('admin', 'professional', 'client'), allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
    timestamps: true,
  }
);
