import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface EmployeeAttributes {
  id: number;
  full_name: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface EmployeeCreationAttributes extends Optional<EmployeeAttributes, 'id' | 'created_at' | 'updated_at' | 'position' | 'department' | 'email' | 'phone'> {}

class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> implements EmployeeAttributes {
  public id!: number;
  public full_name!: string;
  public position?: string;
  public department?: string;
  public email?: string;
  public phone?: string;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: [0, 20]
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    modelName: 'Employee',
    tableName: 'employees',
    timestamps: true,
    underscored: true
  }
);

export default Employee;