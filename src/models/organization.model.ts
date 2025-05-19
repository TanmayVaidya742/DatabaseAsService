import { IOrganization } from '@/interfaces/organization.interface';
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export class OrganizationModel extends Model<IOrganization> implements IOrganization {
  public orgId: string;
  public orgName: string;
  public domain: string;
  public registryId: string;
  public secondaryERPId: string;
  public createdAt: Date;
  public updatedAt : Date;
}

export default function (sequelize: Sequelize): typeof OrganizationModel {
  OrganizationModel.init(
    {
      orgId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field:"orgId",
      },
      domain: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        field:"domain",

      },
      orgName: {
        type: DataTypes.STRING,
        field:"orgName",

      },
      registryId: {
        type: DataTypes.UUID,
        
        defaultValue: DataTypes.UUIDV4,
        field:"registryId",

      },
      secondaryERPId: {
        type: DataTypes.UUID,
        
        defaultValue: DataTypes.UUIDV4,
        field:"secondaryERPId",

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
      tableName: 'organizations',
      sequelize,
      timestamps: true,
      freezeTableName: true,
    },
  );

//   // Add hooks to make the table read-only
//   OrganizationModel.addHook('beforeCreate', () => {
//     throw new Error('Read-only table. Cannot create records.');
//   });

//   OrganizationModel.addHook('beforeBulkCreate', () => {
//     throw new Error('Read-only table. Cannot bulk create records.');
//   });

//   OrganizationModel.addHook('beforeUpdate', () => {
//     throw new Error('Read-only table. Cannot update records.');
//   });

//   OrganizationModel.addHook('beforeDestroy', () => {
//     throw new Error('Read-only table. Cannot delete records.');
//   });

  return OrganizationModel;
}
