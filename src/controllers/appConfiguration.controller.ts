import { HTTP_PROTOCOL, REGISTRY_BACKEND_PORT } from "@/config";
import { RequestWithUser } from "@/interfaces/auth.interface";
import appConfigurationService from "@/services/appConfiguration.service";
import axios from "axios";
import { NextFunction, Request, Response } from "express";

export default class AppConfigurationController {
    private appConfigurationService = new appConfigurationService();
    public addOrganizationPyramid = async (req: Request, res: Response, next: NextFunction) => {
        const orgData = req.body;
        try {
            const result = await this.appConfigurationService.addOrganizationPyramid(orgData);
        if (result && 'error' in result) {
            return res.status(400).json(result);
        }

        res.json(result);
        } catch (error) {
        console.error('Error adding organization:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: 'Failed to add organization',
        });
        }
    };

    public consumerUnitLinkToApp = async (req: Request, res: Response, next: NextFunction) => {
        const consumerUnitData = req.body;
        try {
            const result = await this.appConfigurationService.consumerUnitLinkToApp(consumerUnitData);
        if (result && 'error' in result) {
            return res.status(400).json(result);
        }

        res.json(result);
        } catch (error) {
        console.error('Error linking consumer unit:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: 'Failed to link consumer unit',
        });
        }
    };

        public authenticate = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        try {
            const findUser = req.user;
            const domain = req.hostname;
          
            if (req.query.unitId) {
                const unitId = findUser.unitDetails.id;
                let cuName = String(findUser.unitDetails.unitName);
                // cuName = cuName.trim().replace(' ', '_');
                //replacing all spaces as spaces are not allowed in cookie 
                cuName = cuName.trim().replace(/ /g, '_');
                res.cookie(cuName, unitId, { httpOnly: true,domain:`.${domain}`, maxAge: 9000000 });
            }

        return res.json({findUser});
        } catch (error) {
        console.error('Error linking consumer unit:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: 'Failed to link consumer unit',
        });
        }
    };

    // public getLinkedAppsByOrgId = async (req: Request, res: Response, next: NextFunction) => {
    //     const consumerUnitData = req.body;
    //     try {
    //         const result = await this.appConfigurationService.getLinkedAppsByOrgId(consumerUnitData);
    //     if (result && 'error' in result) {
    //         return res.status(400).json(result);
    //     }

    //     res.json(result);
    //     } catch (error) {
    //     console.error('Error linking consumer unit:', error);
    //     res.status(500).json({
    //         error: 'Internal server error',
    //         details: 'Failed to link consumer unit',
    //     });
    //     }
    // };
    public getLinkedAppsByUserId = async (req: RequestWithUser, res: Response) => {
        try {
            const userId = req.query.userId.toString();

            const domain = req.hostname;

            let appDomainURL;

            if (domain.split('.')[3]) {
                appDomainURL = `${domain.split('.')[2]}.${domain.split('.')[3]}`;
            } else {
                appDomainURL = `${domain.split('.')[2]}.${domain.split('.')[3]}`;
            }

            const appURL = `${HTTP_PROTOCOL}://api.${appDomainURL}:${REGISTRY_BACKEND_PORT}/get-assigned-apps-of-user-by-user-id`;

            const linkedApps = await axios.get(`${appURL}`, { params: { userId: userId, unitType: 'CONSUMER_UNIT' } });

            return res.json({ appsByUnitIdAndUserId: linkedApps.data.unitData });
            } catch (error) {
            return res.status(500).send(error.message);
        }
  };

  public logOut = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // const userData: IUser = req.user;
            // const logOutUserData: IUser = await this.authService.logout(userData);
            // await customInfoLogToConsole({
            //   userId:String(req.headers.userid),
            //   action:logged-out for userId : ${req.headers.userid},
            //   toLog: true,
            // });
            res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);
            const hostName = req.host;
            // const domain = ${hostName.split('.')[0]}.${hostName.split('.')[1]}.${hostName.split('.')[2]}.${hostName.split('.')[3]};
            const domain = hostName;
            const domainURL = domain.split('.');
            const cuName = req.headers['cuname'] as string;
            const ndomain = `.${domainURL[2]}.${domainURL[3]}`;

            console.log({ domain, cuName });

            res.cookie('token', '', { domain: ndomain, path: '/', maxAge: 0, httpOnly: true });

            res.status(200).json({
                message: 'logout'
            });
        } catch (error) {
            next(error);
        }
};
}