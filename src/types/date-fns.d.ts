declare module 'date-fns' {
    export function parse(dateString: string, formatString: string, referenceDate: Date): Date;
    export function isValid(date: unknown): boolean;
}
