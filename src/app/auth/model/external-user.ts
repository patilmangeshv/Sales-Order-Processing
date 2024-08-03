import { Roles } from './roles';

/**External user data which can be different for one single email id. One single email id can be registered 
 * with multiple dealers with different below attributes.*/
export class ExternalUserData {
    /**Dealer id for whose this email id is registered. If dealerID is null means it is registered with all dealers and can access all dealer data.*/
    dealerID?: string;
    dealerCode?: string;
    userName: string;
    /**External system code to map this user and the external system user.*/
    externalCode?: string;
    /**External system code 1 */
    externalCode1?: string;
    /**External system code 2 */
    externalCode2?: string;
    mobileNo?: string;
    roles: Roles;
    /**User is allowed to place orders for the customers who belongs to these areas. If allowedAreas are empty means all areas are allowed.*/
    allowedAreas?: string[];
}
export class ExternalUser {
    externalUserID?: string;
    userProfileID?: string;
    email?: string;
    systemDate?: any;
    userID?: string;
    externalUserData: ExternalUserData;
}