import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ReportAttachmentAttributes {
  id: number;
  report_id: number;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  uploaded_at: Date;
}

interface ReportAttachmentCreationAttributes extends Optional<ReportAttachmentAttributes, 'id' | 'uploaded_at'> {}

class ReportAttachment extends Model<ReportAttachmentAttributes, ReportAttachmentCreationAttributes> implements ReportAttachmentAttributes {
  public id!: number;
  public report_id!: number;
  public filename!: string;
  public original_name!: string;
  public file_type!: string;
  public file_size!: number;
  public file_path!: string;
  public uploaded_at!: Date;
}

ReportAttachment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    report_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'reports',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'ReportAttachment',
    tableName: 'report_attachments',
    timestamps: false,
    underscored: true
  }
);

export default ReportAttachment;