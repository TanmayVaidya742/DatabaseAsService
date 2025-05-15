import { IUser } from '@/interfaces/users.interface';
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export class UserModel extends Model<IUser> implements IUser {
  public userId: string;
  public orgId: string;
  public unitId: string;
  public firstName: string;
  public lastName: string;
  public status: string;
  public email: string;
  public createdAt: Date;
  public updatedAt: Date;
}

export default function (sequelize: Sequelize): typeof UserModel {
  UserModel.init(
    {
      userId:{
        type:DataTypes.UUID,
        primaryKey:true,
      },

      orgId: {
        type: DataTypes.UUID,
        field:"orgId",
        references:{
          model:"organizations", key:"orgId"
        }

      },
      unitId: {
        type: DataTypes.UUID,
        field:"unitId",
        allowNull:false,

      },
      firstName: {
        type: DataTypes.STRING,
        field:"firstName",
        allowNull:false

      },
      lastName: {
        type: DataTypes.STRING,
        field:"lastName",
        allowNull: false

      },
      status: {
        type: DataTypes.STRING,
        field:"status",
        allowNull:false


      },
      email: {
        type: DataTypes.STRING,
        field:"email",
        allowNull:false

      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field:"createdAt",

      },
        updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field:"updatedAt",

      },

    },
    {
      tableName: 'users',
      sequelize,
      timestamps: true,
      freezeTableName: true,
    },
  );

  return UserModel;
}
