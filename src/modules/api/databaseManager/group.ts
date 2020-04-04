import * as database from "../../database";

export interface CreateInput {
    name: string
    public?: boolean
}

/**
 * Create group.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that created the group.
 * @param input Group info.
 * @returns Unique id of group.
 */
export const create = async (databasePath: string, accountId: number, input: CreateInput): Promise<number> => {
    const columns = [ "name", "owner" ];
    const values = [ input.name, accountId ];
    columns.push("public");
    values.push(input.public === true ? 1 : 0);
    const postResult = await database.requests.post(
        databasePath,
        database.queries.insert("document_group", columns),
        values
    );
    return postResult.lastID;
};

/**
 * Update group.
 *
 * @param databasePath Path to database.
 */
export const update = (databasePath: string): void => {
    // TODO
};

export interface RemoveInput {
    id: number
}

/**
 * Remove group.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that wants to remove the group.
 * @param input Group info.
 * @returns True if at least one element was removed otherwise False.
 */
export const remove = async (databasePath: string, accountId: number, input: RemoveInput): Promise<boolean> => {
    const postResult = await database.requests.post(
        databasePath,
        database.queries.remove("document_group", "id"),
        [input.id]
    );
    return postResult.changes > 0;
};

export interface GetInput {
    id: number
}
export interface GetOutput {
    id: number
    name: string
    owner: number
    public: boolean
}
export interface GetDbOut {
    name: string
    owner: number
    public: number
}
export interface GetAllFromOwnerDbOut {
    id: number
    name: string
    public: number
}

/**
 * Get group.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that wants to get the group.
 * @param input Group get info.
 */
export const get = async (
    databasePath: string, accountId: number|undefined, input: GetInput
): Promise<(GetOutput|void)> => {
    const runResult = await database.requests.getEach<GetDbOut>(
        databasePath,
        database.queries.select("document_group", [ "name", "owner", "public" ], {
            whereColumn: "id"
        }),
        [input.id]
    );
    if (runResult) {
        return {
            id: input.id,
            name: runResult.name,
            owner: runResult.owner,
            public: runResult.public === 1
        };
    }
};

/**
 * Get all documents from one author.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that wants to get all groups.
 * @param input Document get info.
 */
export const getAllFromOwner = async (
    databasePath: string, accountId: number|undefined, input: GetInput
): Promise<(GetOutput[]|void)> => {
    const runResults = await database.requests.getAll<GetAllFromOwnerDbOut>(
        databasePath,
        database.queries.select("document_group", [ "id", "name" ], {
            whereColumn: "owner"
        }),
        [input.id]
    );
    if (runResults) {
        return runResults.map(runResult => ({
            id: runResult.id,
            name: runResult.name,
            owner: input.id,
            public: runResult.public === 1
        }));
    }
};

export interface ExistsInput {
    id: number
}
export interface ExistsDbOut {
    // eslint-disable-next-line camelcase
    exists_value: number
}

/**
 * Check if group exists.
 *
 * @param databasePath Path to database.
 * @param input Account exists info.
 * @returns True if group exists.
 */
export const exists = async (
    databasePath: string, input: ExistsInput
): Promise<boolean> => {
    const runResult = await database.requests.getEach<ExistsDbOut>(
        databasePath,
        database.queries.exists("document_group", "id"),
        [input.id]
    );
    if (runResult) {
        return runResult.exists_value === 1;
    }
    return false;
};
