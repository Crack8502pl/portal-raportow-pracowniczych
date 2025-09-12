import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SystemSettingsAttributes {
  id: number;
  setting_key: string;
  setting_value?: string;
  description?: string;
  updated_at: Date;
  updated_by?: number;
}

interface SystemSettingsCreationAttributes extends Optional<SystemSettingsAttributes, 'id' | 'updated_at' | 'setting_value' | 'description' | 'updated_by'> {}

class SystemSettings extends Model<SystemSettingsAttributes, SystemSettingsCreationAttributes> implements SystemSettingsAttributes {
  public id!: number;
  public setting_key!: string;
  public setting_value?: string;
  public description?: string;
  public updated_at!: Date;
  public updated_by?: number;
}

SystemSettings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    setting_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 100]
      }
    },
    setting_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    modelName: 'SystemSettings',
    tableName: 'system_settings',
    timestamps: false,
    underscored: true,
    hooks: {
      beforeUpdate: (settings: SystemSettings) => {
        settings.updated_at = new Date();
      }
    }
  }
);

export default SystemSettings;