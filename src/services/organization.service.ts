import { DB } from "@/databases";
import { IOrganization } from "@/interfaces/organization.interface";

export default class OrganizationService {

    public orgModel = DB.OrganizationModel;
      public async addOrganization(orgData: IOrganization): Promise<IOrganization> {
        let org :IOrganization;
         org = await this.orgModel.findOne({
            where: 
            {
                orgName: orgData.orgName,
            },
            raw: true, // Returns plain JavaScript object
        });

        if(org) {
            return org;
        }
        else {
            org = await this.orgModel.create(orgData);
        }
        return org;
      }
      public async deleteOrganization(orgData: IOrganization): Promise<IOrganization | null> {
        const org = await this.orgModel.findOne({
            where: {
                orgName: orgData.orgName,
            },
            raw: false, // Needed to call `destroy()` on instance
        });
    
        if (org) {
            await org.destroy(); // Deletes the record
            return org.toJSON() as IOrganization; // return deleted org data
        } else {
            return null; // Or throw an error if you prefer
        }
    }
    
}// Returns Sequelize model instance// Returns Sequelize model instance