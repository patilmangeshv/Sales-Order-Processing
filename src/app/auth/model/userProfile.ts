import { Roles } from './roles';
import { ExternalUser, ExternalUserData } from './external-user';

export class UserProfile {
    uid: string;
    isAnonymous?: boolean;
    email: string;
    /**List of Dealer code associated with this user.
     * Empty means allowed to access all dealers data. Customers and Admins are allowed to access
     * all dealers data. But rest of the users are allowed to access only specific dealers.
     * The dealer/manager/operator/salesperson can have access to multiple dealers but not all. 
    */
    // dealerIDs: string[];
    // roles: Roles;
    /**Dealer mapping info. One User profile can be shared by multiple dealers with different set of information.*/
    dealerUserMappingInfo?: ExternalUserData[];
}
/**Interface for User and Area code mapping.*/
export interface IUserArea {
    email: string;
    areaCodes: string[];
}