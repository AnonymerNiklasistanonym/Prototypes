import * as database from "../../database";
import crypto from "../../crypto";

export interface CreateInput {
    name: string
    password: string
    admin?: boolean
    public?: boolean
}

export enum CreateError {
    USER_NAME_ALREADY_EXISTS = "USER_NAME_ALREADY_EXISTS"
}

/**
 * Create account.
 *
 * @param databasePath Path to database.
 * @param input Account info.
 * @returns Unique id of account.
 */
export const create = async (databasePath: string, input: CreateInput): Promise<number> => {
    const columns = [ "name", "password_hash", "password_salt" ];
    const hashAndSalt = crypto.generateHashAndSalt(input.password);
    const values: (string|number)[] = [ input.name, hashAndSalt.hash, hashAndSalt.salt ];
    columns.push("admin");
    values.push(input.admin === true ? 1 : 0);
    columns.push("public");
    values.push(input.public === true ? 1 : 0);
    try {
        const postResult = await database.requests.post(
            databasePath,
            database.queries.insert("account", columns),
            values
        );
        return postResult.lastID;
    } catch (error) {
        if (database.requests.isDatabaseError(error)) {
            if (error.code === database.requests.ErrorCodePostRequest.SQLITE_CONSTRAINT) {
                throw CreateError.USER_NAME_ALREADY_EXISTS;
            }
        }
        throw error;
    }
};


export interface RemoveInput {
    id: number
}

/**
 * Remove account.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that created the document.
 * @param input Remove info.
 */
export const remove = async (databasePath: string, accountId: number, input: RemoveInput): Promise<boolean> => {
    const postResult = await database.requests.post(
        databasePath,
        database.queries.remove("account", "id"),
        [input.id]
    );
    return postResult.changes > 0;
};

export interface ExistsNameInput {
    name: string
}
export interface ExistsInput {
    id: number
}
export interface ExistsDbOut {
    // eslint-disable-next-line camelcase
    exists_value: number
}

/**
 * Check if account exists.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account.
 * @param input Account exists info.
 * @returns True if account exists.
 */
export const existsName = async (
    databasePath: string, accountId: number, input: ExistsNameInput
): Promise<boolean> => {
    const runResult = await database.requests.getEach(
        databasePath,
        database.queries.exists("account", "name"),
        [input.name]
    ) as ExistsDbOut;
    return runResult.exists_value === 1;
};

/**
 * Check if account exists.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account.
 * @param input Account exists info.
 * @returns True if account exists.
 */
export const exists = async (databasePath: string, accountId: number, input: ExistsInput): Promise<boolean> => {
    const runResult = await database.requests.getEach(
        databasePath,
        database.queries.exists("account", "id"),
        [input.id]
    ) as ExistsDbOut;
    return runResult.exists_value === 1;
};

export interface CheckLoginInput {
    name: string
    password: string
}
export interface CheckLoginDbOut {
    id: number
    // eslint-disable-next-line camelcase
    password_hash: string
    // eslint-disable-next-line camelcase
    password_salt: string
}

/**
 * Check if account login is correct.
 *
 * @param databasePath Path to database.
 * @param input Account login info.
 * @returns If password is correct the account id is returned.
 */
export const checkLogin = async (
    databasePath: string, input: CheckLoginInput
): Promise<(number|void)> => {
    const runResult = await database.requests.getEach(
        databasePath,
        database.queries.select("account", [ "id", "password_hash", "password_salt" ], {
            whereColumn: "name"
        }),
        [input.name]
    ) as CheckLoginDbOut;
    if (runResult) {
        const passwordCorrect = crypto.checkPassword(input.password, {
            hash: runResult.password_hash,
            salt: runResult.password_salt
        });
        return passwordCorrect ? runResult.id : undefined;
    } else {
        return undefined;
    }
};

export interface GetInput {
    id: number
}
export interface GetOutput {
    id: number
    name: string
    admin: boolean
    public: boolean
}
export interface GetDbOut {
    name: string
    admin: number
    public: number
}

/**
 * Get account.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that created the document.
 * @param input Account get info.
 */
export const get = async (databasePath: string, accountId: number, input: GetInput): Promise<(GetOutput|void)> => {
    const runResult = await database.requests.getEach(
        databasePath,
        database.queries.select("account", [ "name", "admin", "public" ], {
            whereColumn: "id"
        }),
        [input.id]
    ) as GetDbOut;
    if (runResult) {
        return {
            admin: runResult.admin === 1,
            id: input.id,
            name: runResult.name,
            public: runResult.public === 1
        };
    }
};

export interface UpdateInput {
    id: number
    name?: string
    password?: string
    admin?: boolean
    public?: boolean
}

/**
 * Update account.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that created the document.
 * @param input Account get info.
 */
export const update = async (databasePath: string, accountId: number, input: UpdateInput): Promise<(boolean|void)> => {
    const columns = [];
    const values = [];
    if (input.admin !== undefined) {
        columns.push("admin");
        values.push(input.admin ? 1 : 0);
    }
    if (input.public !== undefined) {
        columns.push("public");
        values.push(input.public ? 1 : 0);
    }
    if (input.password) {
        const hashAndSalt = crypto.generateHashAndSalt(input.password);
        columns.push("password_hash", "password_salt");
        values.push(hashAndSalt.hash, hashAndSalt.salt);
    }
    if (input.name) {
        columns.push("name");
        values.push(input.name);
    }
    values.push(input.id);
    const postResult = await database.requests.post(
        databasePath,
        database.queries.update("account", columns, "id"),
        values
    );
    return postResult.changes > 0;
};
