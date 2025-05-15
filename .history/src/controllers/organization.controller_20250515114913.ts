import OrganizationService from "@/services/organization.service";
import { NextFunction, Request, Response } from "express";

export default class OrganizationController {
    private orgService = new OrganizationService();

  public createOrganization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orgData = req.body;
        const orgaization = await this.orgService.addOrganization(orgData)
      res.status(201).json({ data: orgaization, message: 'signup' });
    } catch (error) {
      next(error);
    }
  };


  public getUsers = async
}