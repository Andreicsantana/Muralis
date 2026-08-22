import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface ShareAttributes {
  id: string;
  projectId: string;
  token: string;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShareCreationAttributes extends Optional<ShareAttributes, 'id' | 'expiresAt' | 'createdAt' | 'updatedAt'> {}

export class Share extends Model<ShareAttributes, ShareCreationAttributes> implements ShareAttributes {
  public id!: string;
  public projectId!: string;
  public token!: string;
  public expiresAt?: Date | null;
  public project?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Share.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'shares',
    underscored: true
  }
);
