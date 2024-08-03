import {
    format, addDays, addMonths, addYears, addSeconds, addMinutes, addHours
    , differenceInYears, differenceInQuarters, differenceInMonths, differenceInDays, differenceInWeeks
    , differenceInHours, differenceInMinutes, differenceInSeconds, isLeapYear
} from 'date-fns';

export { }
/**
 * Indicates how to determine and format date intervals when calling date-related functions.
 */

export enum dateInterval {
    /** Year*/
    year = 0,
    /** Quarter of year (1 through 4) */
    quarter = 1,
    /** Month (1 through 12) */
    month = 2,
    /** Day of year (1 through 366) */
    dayOfYear = 3,
    /** Day of month (1 through 31) */
    day = 4,
    /** Week of year (1 through 53) */
    weekOfYear = 5,
    /** Day of week (1 through 7) */
    weekday = 6,
    /** Hour (0 through 23) */
    hour = 7,
    /** Minute (0 through 59) */
    minute = 8,
    /** Second (0 through 59) */
    second = 9
}

/** Indicates the type of comparison to do.*/
export enum compareType {
    /** Equal comparison */
    equal,
    /** Not equal comparison */
    notEqual,
    /** Less than comparison */
    lessThan,
    /** Less than equal to comparison */
    lessThanEqual,
    /** Greater than comparison */
    greaterThan,
    /** Greater than equal to comparison */
    greaterThanEqual
}

// Add methods to the global module.
declare global {

    // Extends Date interface
    // ======================
    interface Date {
        /** Returns a Date value containing a date and time value to which a specified time interval has been added. 
         * @param interval dateInterval enumeration value representing the time interval you want to add.
         * @param number The number of intervals you want to add. Number can be positive (to get date/time values in the future)
         *    or negative (to get date/time values in the past).
         * @returns Returns a Date value containing a date and time value to which a specified time interval has been added.
         * @example new Date().dateAdd(dateInterval.day, 10); 
         *          new Date().dateAdd(dateInterval.day, -10);
         *          new Date().dateAdd(dateInterval.month, 2);
         * @tutorial https://date-fns.org/v2.14.0/docs/addDays
         *    
        */
        dateAdd(interval: dateInterval, number: number): Date;
        /**
         * Returns a number value specifying the number of time intervals between two Date values.
         * 
         * @param interval dateInterval enumeration value representing the
         *     time interval you want to use as the unit of difference between itself and otherDate.
         * @param otherDate Other date/time value you want to use in the calculation.
         * @returns Returns a number value specifying the number of time intervals between two Date values.
         * @example new Date().dateDiff(dateInterval.day, dtBusinessdate);
         *          new Date().dateDiff(dateInterval.month, dtBusinessdate);
         *          dtBusinessdate.dateDiff(dateInterval.month, new Date());
         * @tutorial https://date-fns.org/v2.14.0/docs/differenceInDays
         */
        dateDiff(interval: dateInterval, otherDate: Date): number;
        /**
         * Returns a string expression representing a date/time value.
         * @param formatString  Optional. Numeric value that indicates the date/time format used. If omitted, DateFormat.GeneralDate is used.
         * @param options 
         * @example new Date().formatDateTime("Qo ddd-MMM-YYYY")
         *      more examples can be found at the below URL.
         * @tutorial https://date-fns.org/v2.14.0/docs/format
         */
        formatDateTime(formatString: string, options?: { locale?: Object; }): string;

        /**
         * Compares with other date and for specified interval.
         * @param compare Indicator of type of comparison.
         * @param otherDate Date to be compared with.
         * @param  interval Indicator to specify the part of the date for comparison.
         * @returns Returns a boolean value of the comparison.
         * @example new Date().compare(compareType.equal, dtBusinessdate);
         *          new Date().compare(compareType.notEqual, dtBusinessdate);
         *          new Date().compare(compareType.equal, dtBusinessdate, dateInterval.month);
         *          new Date().compare(compareType.lessThan, dtBusinessdate, dateInterval.month);
         *          new Date().compare(compareType.greaterThanEqual, dtBusinessdate, dateInterval.month);
         */
        compare(compare: compareType, otherDate: Date, interval?: dateInterval): boolean;

        isLeapYear(theDate: Date): boolean;
    }

    // Extends String interface
    // ======================
    interface String {
        /**
         * Replaces the item in the string with the string representation of a corresponding object in a specified array.
         * @param args Multiple values to be replaced on positional basis.
         * @example console.log("Hello, {0}! How are you {1}".format("World", "Mr. X"))
         */
        format(...args: any): string;
    }
}


// Implement newly added methods.
Date.prototype.dateAdd = function (interval: dateInterval, number: number): Date {
    let newDate: Date = null;

    switch (interval) {
        case dateInterval.day:
            newDate = addDays(this, number);
            break;
        case dateInterval.month:
            newDate = addMonths(this, number);
            break;
        case dateInterval.year:
            newDate = addYears(this, number);
            break;
        case dateInterval.second:
            newDate = addSeconds(this, number);
            break;
        case dateInterval.minute:
            newDate = addMinutes(this, number);
            break;
        case dateInterval.hour:
            newDate = addHours(this, number);
            break;
    }
    return newDate;
};

Date.prototype.dateDiff = function (interval: dateInterval, otherDate: Date): number {
    var difference: number = null;

    switch (interval) {
        case dateInterval.day:
            difference = differenceInDays(this, otherDate);
            break;
        case dateInterval.month:
            difference = differenceInMonths(this, otherDate);
            break;
        case dateInterval.year:
            difference = differenceInYears(this, otherDate);
            break;
        case dateInterval.second:
            difference = differenceInSeconds(this, otherDate);
            break;
        case dateInterval.minute:
            difference = differenceInMinutes(this, otherDate);
            break;
        case dateInterval.hour:
            difference = differenceInHours(this, otherDate);
            break;
    }
    return difference
}

Date.prototype.formatDateTime = function (formatString: string, options?: { locale?: Object; }): string {
    return format(this, formatString, options);
}

Date.prototype.compare = function (compare: compareType, otherDate: Date, interval?: dateInterval): boolean {
    var difference: number, returnValue: boolean = false;

    // If interval is not specified then assume it is a day interval dateInterval.day.
    if (!interval) {
        interval = dateInterval.day;
    }

    difference = this.dateDiff(interval, otherDate);

    switch (compare) {
        case compareType.equal:
            returnValue = (difference == 0);
            break;
        case compareType.notEqual:
            returnValue = !(difference == 0);
            break;
        case compareType.lessThan:
            returnValue = (difference < 0);
            break;
        case compareType.lessThanEqual:
            returnValue = (difference <= 0);
            break;
        case compareType.greaterThan:
            returnValue = (difference > 0);
            break;
        case compareType.greaterThanEqual:
            returnValue = (difference >= 0);
            break;
    }

    return returnValue;
}

Date.prototype.isLeapYear = function (theDate: Date): boolean {
    return isLeapYear(theDate);
}

String.prototype.format = function () {
    var thisString = this;
    for (var arg in arguments) {
        thisString = thisString.replace(new RegExp("\\{" + arg + "\\}", 'g'), arguments[arg]);
    }
    return thisString;
}