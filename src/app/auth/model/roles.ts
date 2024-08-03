export interface Roles {
    /**Super user of the application.*/
    admin?: boolean;
    /**Owner of the bussiness.*/
    dealer?: boolean;
    /**Manager hired by dealer to manage the deliveries.*/
    manager?: boolean;
    /**Computer operator hired by dealer as a data entry operator.*/
    operator?: boolean;
    salesperson?: boolean;
    customer?: boolean;
}
