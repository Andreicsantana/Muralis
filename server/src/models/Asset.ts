import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

export type AssetType = 'photo' | 'art' | 'mask' | 'export';

export interface AssetAttributes {
  id: string;
  ownerId: string;
  type: AssetType;
  storageKey: string;
  width?: number;
  height?: number;
  mimeType: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssetCreationAttributes extends Optional<AssetAttributes, 'id' | 'width' | 'height' | 'createdAt' | 'updatedAt'> {}

export class Asset extends Model<AssetAttributes, AssetCreationAttributes> implements AssetAttributes {
  public id!: string;
  public ownerId!: string;
  public type!: AssetType;
  public storageKey!: string;
  public width?: number;
  public height?: number;
  public mimeType!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Asset.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('photo', 'art', 'mask', 'export'),
      allowNull: false
    },
    storageKey: {
      type: DataTypes.STRING,
      allowNull: false
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'assets',
    underscored: true
  }
);
