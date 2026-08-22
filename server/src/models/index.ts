import { User } from './User.js';
import { Asset } from './Asset.js';
import { Project } from './Project.js';
import { Share } from './Share.js';

User.hasMany(Asset, { foreignKey: 'ownerId', as: 'assets' });
Asset.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(Project, { foreignKey: 'userId', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.belongsTo(Asset, { foreignKey: 'basePhotoId', as: 'basePhoto' });
Project.belongsTo(Asset, { foreignKey: 'artAssetId', as: 'artAsset' });
Project.belongsTo(Asset, { foreignKey: 'maskAssetId', as: 'maskAsset' });

Project.hasMany(Share, { foreignKey: 'projectId', as: 'shares' });
Share.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

export { User, Asset, Project, Share };
