import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ActivityLogAttributes {
  id: number;
  user_id?: number;
  action: string;
  resource_type?: string;
  resource_id?: number;
  details?: object;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

interface ActivityLogCreationAttributes extends Optional<ActivityLogAttributes, 'id' | 'created_at' | 'user_id' | 'resource_type' | 'resource_id' | 'details' | 'ip_address' | 'user_agent'> {}

class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> implements ActivityLogAttributes {
  public id!: number;
  public user_id?: number;
  public action!: string;
  public resource_type?: string;
  public resource_id?: number;
  public details?: object;
  public ip_address?: string;
  public user_agent?: string;
  public created_at!: Date;
}

ActivityLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    resource_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    resource_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'ActivityLog',
    tableName: 'activity_logs',
    timestamps: false,
    underscored: true
  }
);

export default ActivityLog;