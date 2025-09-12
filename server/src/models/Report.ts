import { Model, DataTypes, Optional, Association, HasManyGetAssociationsMixin, HasManyAddAssociationMixin } from 'sequelize';
import sequelize from '../config/database';

export interface ReportAttributes {
  id: number;
  created_by_user_id: number;
  report_date: Date;
  object_name: string;
  work_description: string;
  notes?: string;
  version: number;
  status: 'draft' | 'sent';
  created_at: Date;
  updated_at: Date;
}

interface ReportCreationAttributes extends Optional<ReportAttributes, 'id' | 'created_at' | 'updated_at' | 'version' | 'status' | 'notes'> {}

class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  public id!: number;
  public created_by_user_id!: number;
  public report_date!: Date;
  public object_name!: string;
  public work_description!: string;
  public notes?: string;
  public version!: number;
  public status!: 'draft' | 'sent';
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public getReportWorkers!: HasManyGetAssociationsMixin<any>;
  public addReportWorker!: HasManyAddAssociationMixin<any, number>;
  public getReportAttachments!: HasManyGetAssociationsMixin<any>;
  public addReportAttachment!: HasManyAddAssociationMixin<any, number>;

  public static associations: {
    reportWorkers: Association<Report, any>;
    reportAttachments: Association<Report, any>;
    createdByUser: Association<Report, any>;
  };
}

Report.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    created_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    report_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    object_name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 300]
      }
    },
    work_description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 300]
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 300]
      }
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent'),
      allowNull: false,
      defaultValue: 'sent'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    timestamps: true,
    underscored: true
  }
);

export default Report;