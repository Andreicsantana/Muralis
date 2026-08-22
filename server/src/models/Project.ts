import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface Point2D {
  x: number;
  y: number;
}

export type BlendModeType = 'normal' | 'multiply' | 'overlay' | 'soft-light';

export interface ProjectAttributes {
  id: string;
  userId: string;
  title: string;
  basePhotoId?: string | null;
  artAssetId?: string | null;
  maskAssetId?: string | null;
  cornerPoints: Point2D[];
  blendMode: BlendModeType;
  opacity: number;
  brightness: number;
  contrast: number;
  status: 'draft' | 'exported';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProjectCreationAttributes extends Optional<
  ProjectAttributes,
  'id' | 'basePhotoId' | 'artAssetId' | 'maskAssetId' | 'blendMode' | 'opacity' | 'brightness' | 'contrast' | 'status' | 'createdAt' | 'updatedAt'
> {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: string;
  public userId!: string;
  public title!: string;
  public basePhotoId?: string | null;
  public artAssetId?: string | null;
  public maskAssetId?: string | null;
  public cornerPoints!: Point2D[];
  public blendMode!: BlendModeType;
  public opacity!: number;
  public brightness!: number;
  public contrast!: number;
  public status!: 'draft' | 'exported';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Untitled Project'
    },
    basePhotoId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    artAssetId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    maskAssetId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    cornerPoints: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [
        { x: 0.1, y: 0.1 },
        { x: 0.9, y: 0.1 },
        { x: 0.9, y: 0.9 },
        { x: 0.1, y: 0.9 }
      ]
    },
    blendMode: {
      type: DataTypes.ENUM('normal', 'multiply', 'overlay', 'soft-light'),
      defaultValue: 'multiply',
      allowNull: false
    },
    opacity: {
      type: DataTypes.FLOAT,
      defaultValue: 0.9,
      allowNull: false
    },
    brightness: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0,
      allowNull: false
    },
    contrast: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'exported'),
      defaultValue: 'draft',
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'projects',
    underscored: true
  }
);
