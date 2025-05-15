import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db'; // Adjust path as needed

// Interface for attributes
interface DatabaseAttributes {
  id: number;
  name: string;
  user_id: string;
  created_at?: Date;
  updated_at?: Date;
}

// Optional attributes for creation
interface DatabaseCreationAttributes extends Optional<DatabaseAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Model class
class Database extends Model<DatabaseAttributes, DatabaseCreationAttributes> implements DatabaseAttributes {
  public id!: number;
  public name!: string;
  public user_id!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// Init model
Database.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Database',
    tableName: 'databases',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Database;
