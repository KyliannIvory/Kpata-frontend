import {ApiErrorResponse} from "@/app/lib/definitions";

export const groupFieldErrors = ( apiResponse: ApiErrorResponse): Record<string, string[]> => {

    const errors: Record<string, string[]> = {}
    for (const fieldError of apiResponse.fieldErrors) {
        const field = fieldError.field;
        const message = fieldError.message;

        if (!errors[field]) {
            errors[field] = [];
        }
        errors[field].push(message);
    }

    return errors;
}