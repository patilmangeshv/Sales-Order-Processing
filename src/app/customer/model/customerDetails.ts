export class CustomerDetails {
    /**Customer ID. This will be the ID of the userProfile user ID which is 
     * linked to the Customer if the user profile is for the Customer.*/
    customerID?: string;
    /**UserProfile UID associated with the customer.*/
    userProfileUID?: string;
    dealerID: string;
    customerName: string;
    /**External system code to map the items between this and the external system.*/
    externalCode?: string;
    /**External system code 1 */
    externalCode1?: string;
    /**External system code 2 */
    externalCode2?: string;
    /**Tags for the customer. This will hold the item customerName, externalCode, externalCode1, externalCode2, mobileNo, pincode.
    * The search will be happen on these fields to centralise the search of the customer.*/
    public get tags(): string {
        return this.customerName + " " + this.externalCode + " " + this.externalCode1 + " " + this.externalCode2 + " " + this.mobileNo + " " + this.pincode;
    }
    /**Is retail customer or not.*/
    isRetailer?: boolean;
    mobileNo?: string;
    deliveryAddress: string;
    /**Customer area code from external system.*/
    areaCode: string;
    pincode?: string;
    email?: string;
    gstNo?: string;
    gstate_cd?: string;
    gst_regstr?: string;
    foodLicenseNo?: string;
    /**Flag to determine if the Item is available for sale.*/
    isActive: boolean;
}