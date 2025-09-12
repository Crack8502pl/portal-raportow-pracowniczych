import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ReportWorkerAttributes {
  id: number;
  report_id: number;
  employee_id: number;
  start_time: string;
  end_time: string;
  is_creator: boolean;
  created_at: Date;
}

interface ReportWorkerCreationAttributes extends Optional<ReportWorkerAttributes, 'id' | 'created_at' | 'is_creator'> {}

class ReportWorker extends Model<ReportWorkerAttributes, ReportWorkerCreationAttributes> implements ReportWorkerAttributes {
  public id!: number;
  public report_id!: number;
  public employee_id!: number;
  public start_time!: string;
  public end_time!: string;
  public is_creator!: boolean;
  public created_at!: Date;
}

ReportWorker.init(
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
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id'
      }
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        isAfterStartTime(value: string) {
          if (this.start_time && value <= this.start_time) {
            throw new Error('End time must be after start time');
          }
        }
      }
    },
    is_creator: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'ReportWorker',
    tableName: 'report_workers',
    timestamps: false,
    underscored: true
  }
);

export default ReportWorker;