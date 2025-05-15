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
            raw: true,
        });

        if(org) {
            return org;
        }
        else {
            org = await this.orgModel.create(orgData);
        }
        return org;
      }
    
}