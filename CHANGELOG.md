# 1.7.4 (2021-Sep-3)
## Features
1. Hide customer related additional fields from order screen
2. Corrected message grammer
----------
# 1.7.3 (2021-Aug-30)
## Bug Fixes
1. Fix issue in Areas to Users for available areas as + delimited
----------
# 1.7.1 (2021-Mar-24)
## Features
1. Added feature in which the user is allowed to place orders only for listed areas under which the customer belongs to.
----------
# 1.7 (2021-Mar-21)
## Features
1. Replicating changes from item to itemPackage and itemStockPrice for itemDescription, itemImageThumURL and itemImageURLs.
2. Added remove image option in item and item package detail screens
3. Removed itemDescription and category validations
4. Image file size changed from 1 MB to 800 MB
5. Added itemPackageName in IItemPackage
6. **Created new manufacturer, category, item and itemPackage on uploading itemStockPrice file**
## Bug Fixes
1. Fixed issue of showing itemName instead of itemPackageName in Item package detail screen
----------
# 1.69.15 (2021-Mar-12)
## Features
1. Added isRetailer field in customer document
2. Retail customers will see selling price instead of wholesaler prices
----------
# 1.69.14 (2021-Mar-11)
## Bug Fixes
1. Shows and stores wholesale prices while creating sales order.
    **NOTE: The retailer customer (selling price) needs to work out again.**
2. Added stockMinimumQty in itemStockPrice document to control the in stock qty.
----------
# 1.69.13 (2021-Mar-09)
## Features
1. Shows GST & Cess Pc in sales order list
2. Shows GST price in four digits
## Bug Fixes
1. Fixed issue of rounding off wholesalePriceWithGST while saving in in sales order.
----------
# 1.69.12 (2021-Mar-09)
## Features
1. Added delete sales order option for all status and allowed only to admin, dealer and manager role
2. Displays company code alongwith the company name in the title and the company selection list
----------
# 1.69.11 (2021-Mar-08)
## Features
1. Added gstate_cd,gst_regstr fields in Customer model class and replicated in all places.
----------
# 1.69.10 (2021-Jan-28)
## Features
1. Added hsn_cd,stk_marg fields in ItemStockPrice and OrderItemData model class and replicated in all places.
----------
# 1.69.9 (2021-Jan-27)
## Features
1. Added gst_pc,gcess_pc,free_qty,off_onmrp field in ItemStockPrice and OrderItemData model class and replicated in all places.
----------
# 1.69.7 & 1.69.8 (2020-Dec-13)
## Features
1. Added google analytics in Customer selection list and item order list pages.
2. Added wholesalePriceWithGST field in ItemStockPrice and OrderItemData model class and replicated in all places.
----------
# 1.69.6 (2020-Dec-13)
## Features
1. Company code is added in all import and sales order export as first column. If company code is not matched with the current dealer's company code it will ignore the record.
2. In sales order, individual sales order is allowed to select from pending order status and only those orders will be exported.
## Bug Fixes
1. Dealer change is restricted to main modules only and not in the sub screen like item selection or customer selection.
----------
# 1.69.5 (2020-Dec-13)
## Features
1. [Centralise dealer info and allow user to change dealer](https://github.com/patilmangeshv/order-mst/issues/17)
----------
# 1.69.4 (2020-Dec-10)
## Bug Fixes
1. Added dealerCode in ExternalUserData
----------
# 1.69.3 (2020-Dec-10)
## Bug Fixes
1. [Favourite item is not displayed in the item selection list](https://github.com/patilmangeshv/order-mst/issues/15)
----------
# 1.69.2 (2020-Dec-05)
## Features
1. [Improved performance in the customer list and item selection list by implementing caching.](https://github.com/patilmangeshv/order-mst/issues/12)
2. Optimised the code in sales order list page.
3. [Sales order list order is been changed from order date to sales order number](https://github.com/patilmangeshv/order-mst/issues/13)
----------
# 1.69.1 (2020-Nov-25)
## Bug Fixes
1. [Fixed issue of showing sales order number count. It was shwoing and updating sales order based on the total items present in all selected sales order.](https://github.com/patilmangeshv/order-mst/issues/10)
----------
# 1.69 (2020-Nov-25)
## Bug Fixes
1. Added missing fields mrp, areaCode in sales order which was required for creating sales bill
2. Added fields (dataExportedDateTime & dataExportedUserIDName) to flag the sales order is exported
3. Order list has new filter as "Exported?" to hide exported sales order.
4. [Order list has Export orders option for "Pending" orders to export to file and mark the export flag in sales order.](https://github.com/patilmangeshv/order-mst/issues/6)
5. Changed Order list by descending orderDate
6. Added getRandomNumberString() in Utilities for getting random number string
7. Removed access to annonymous user access. Only logged in user can read the database. (Only dealers document can be read by unauthorised user)
----------
# 1.68 (2020-Nov-22)
## Bug Fixes
1. Added all users to be created through users file upload in the system
2. One email id can be assigned to multiple dealer with different roles
3. Roles of a user will be different for different dealers
4. Streamlined userProfileData
----------
# 1.67 (2020-Nov-22)
## Bug Fixes
1. [Read & store areadCode while uploading customer data from file](https://github.com/patilmangeshv/order-mst/issues/9)
2. [Password reset link should not be sent to already exists user](https://github.com/patilmangeshv/order-mst/issues/8)
3. [Should show number of records if no records present in customer and item selection list](https://github.com/patilmangeshv/order-mst/issues/7)

----------
# 1.66 (2020-Nov-17)
## Bug Fixes
1. Standard look in all page for dealer information and removed repeated style sheets.
----------
# 1.65 (2020-Nov-16)
## Features
1. **Customer wise favorite items. Favorite customer's items will come in the top of the item selection list.**
----------
# 1.64 (2020-Nov-09)
## Features
1. **Item order selection screen has sorted items with showing selected items on top and then the rest of the items.**
----------
# 1.63 (2020-Nov-08)
## Bug Fixes

## Features
1. **Allow quantity to set while selecting the items**
----------
# 1.62
## Features
1. Added skeleton text to customer selection list and item selection list.
2. Hide Signup and guest login for external system.
3. IONIC icons offline stored solved by copying to the assets.

## Bug fixes
1. Upload data page route issue resolved.

----------
# 1.59, 1.60 & 1.61

## Features
1. Implemented deletion of the customer, item stock price and salesperson documents.
2. Optimised Customer and Item selection in the context of the data read.
3. Implmented cached data version so that the fresh data will be fetched if there is change in the underline static data document.
4. Set backround color to order status in Order List page
----------
# 1.58

## Features
1. Added Order date field on order placement screen.
2. Changed icon color to red for add/remove items on home screen.
3. Added order inputed by field and shown on the order list scren for filtering the orders.
----------
# 1.57

## Features
1. Added sales person role
2. Added file upload for customer, items and salesperson with creating userProfile (using cloud function) for the salesperson having email id and sending password reset links to the email id.
3. Added new flag hasExternalSystem in dealer to identify as to have external data system.
3.1. When hasExternalSystem is true, system will not allow manual entry of customer details but will show customer selection screen and will fetch the details based on the selection.
3.2. If the logged in user is the customer then he is suppose to select the own record by using customer selection screen.
3.3. If the logged in user is salesperson then he will see all the customers and allowed to select any customer.
3.4. The salesperson and the customer will see only their own placed orders in "Order list" other users can see all orders.

## Bug fixes
1. Turned off auto complete fields on home screen to avoid suggestions in the input controls.
2. Added methods to clearup data from items, sales orders
----------
# 1.56

## Features
1. Added wholesalePrice,externalCode,externalCode1,externalCode2 fields across all forms

----------
# 1.55
## Base version for order-mst

----------
# 1.54
## Bug fixes
1. Flag of stock maintained was not working correctly.
2. Autofocus set to the first input control on multiple forms. Still the issue exists for the modal forms.

## Features
----------
# 1.53
## Bug fixes
1. Bug fix if the stock not maintained was not working correctly in sales order and purchase order forms.
2. Changed cloud functions region to asia-east2 from us.

## Features
1. Added box package unit.
----------
# 1.52
## Bug fixes

## Features
1. Implemented FCM, Firebase cloud messaging on sales order status change.
----------
# 1.51
## Bug fixes
1. Bug fixed in CF replicateItemChanges, for not updating the item changes to item package document. Also added changes to replicate the changes in item stock price table.

## Features
1. Create new CF createItemStockPrice_onCreate_purchaseOrderItems to create item stock price based on purchase order. The stock will increased if the itempackage, mrp and selling prices matches else it will create a new item stock price record.
2. Separated Purchase order item document and item stock price document.
----------
# 1.50
## Bug fixes
1. Purchase order closes when closes item selection.
2. Purchase order was allowing to save order without items.
3. Renamed salesOrders document to salesOrder.

## Features
1. Added cloud functions to update salesOrderNo in salesOrder document.
----------
# 1.49

## Bug fixes
1. Resolved issue of image upload in New & Modify mode for Item detail screen.
2. Hide Item image URLs field as it is currently not in use in Item detail screen.
3. Resolved the issue of hardware back button closes the app, does not close the modal forms.

## Features
1. Added pages and dozen in packageUnits.
2. Added item image thumnail option in item package detail screen.
3. Added privacy policy and term of service pages on SignUp form.
----------
# 1.48

## Bug fixes

## Features
1. Partial image file upload function in item only. some fixes needs to be done.
2. Quantity validation with balance qty and balance qty is reduced by Quantity in Sales Order.

----------
# 1.47

## Bug fixes
1. HTML view for itemDescription.
2. Increased the item package size limit from 1000 to 10000.

## Features
1. Added batch operation for database update in itemService.
2. Added menu to add purchase order to add a stock and price.
3. date-fns library and wrote date related functions for comparison and formatting.

----------
# 1.46

## Bug fixes

## Features
1. Add new item and item packages using Item list menu.
2. Auto incremented salesOrderNo in salesOrders document.
