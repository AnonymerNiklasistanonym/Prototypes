import * as account from "./account";
import * as database from "../../database";
import * as pdfOptions from "./documentPdfOptions";

export interface CreateInputResource {
    relativePath: string
    content: string | Buffer
}

export interface CreateInput {
    owner: number
    title: string
    content: string
    authors?: string
    date?: string
    pdfOptions?: pdfOptions.PdfOptions
    resources?: CreateInputResource[]
    public?: boolean
}

/**
 * Create document.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that created the document.
 * @param input Document info.
 * @returns Unique id of document.
 */
export const create = async (databasePath: string, accountId: number, input: CreateInput): Promise<number> => {
    // Check if account exists
    if (!await account.exists(databasePath, { id: input.owner })) {
        throw Error("Account does not exist");
    }
    // If ids do not match check if account that wants to access it is admin
    if (input.owner !== accountId && !await account.isAdmin(databasePath, accountId)) {
        const error: any = Error("No account access");
        error.httpErrorCode = 403;
        throw error;
    }

    const columns = [ "title", "content", "owner" ];
    const values = [ input.title, input.content, accountId ];
    if (input.authors) {
        columns.push("authors");
        values.push(input.authors);
    }
    if (input.date) {
        columns.push("date");
        values.push(input.date);
    }
    if (input.resources) {
        // TODO Implement
    }
    if (input.pdfOptions) {
        // TODO Do better (SQL style with custom columns/tables, sanitize input)
        columns.push("pdf_options");
        values.push(JSON.stringify(input.pdfOptions));
    }
    columns.push("public");
    values.push(input.public === true ? 1 : 0);
    const postResult = await database.requests.post(
        databasePath,
        database.queries.insert("document", columns),
        values
    );
    return postResult.lastID;
};

export interface ExistsInput {
    id: number
}

export interface ExistsDbOut {
    // eslint-disable-next-line camelcase
    exists_value: number
}

/**
 * Does a document exist.
 *
 * @param databasePath Path to database.
 * @param input Document info.
 * @returns True if exists otherwise False.
 */
export const exists = async (databasePath: string, input: ExistsInput): Promise<boolean> => {
    const runResult = await database.requests.getEach<ExistsDbOut>(
        databasePath,
        database.queries.exists("document", "id"),
        [input.id]
    );
    if (runResult) {
        return runResult.exists_value === 1;
    }
    return false;
};


export interface GetInput {
    id: number
    getContent?: boolean
    getPdfOptions?: boolean
}
export interface GetOutput {
    id: number
    title: string
    public: boolean
    authors?: string
    date?: string
    owner: number
    group?: number
    content: string
    pdfOptions?: pdfOptions.PdfOptions
}
export interface GetDbOut {
    title: string
    authors: string
    public: number
    date: string
    owner: number
    // eslint-disable-next-line camelcase
    document_group: number
    content: string
    // eslint-disable-next-line camelcase
    pdf_options: string
}

/**
 * Get document.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that created the document.
 * @param input Document get info.
 */
export const get = async (
    databasePath: string, accountId: number|undefined, input: GetInput
): Promise<(GetOutput|void)> => {
    const columns = [ "title", "authors", "date", "owner", "public" ];
    if (input.getContent) {
        columns.push("content");
    }
    if (input.getPdfOptions) {
        columns.push("pdf_options");
    }
    const runResult = await database.requests.getEach<GetDbOut>(
        databasePath,
        database.queries.select("document", columns, {
            whereColumn: "id"
        }),
        [input.id]
    );
    if (runResult) {
        let pdfOptionsObj;
        if (runResult.pdf_options && runResult.pdf_options !== null) {
            pdfOptionsObj = JSON.parse(runResult.pdf_options);
        }
        return {
            authors: runResult.authors !== null ? runResult.authors : undefined,
            content: runResult.content,
            date: runResult.date !== null ? runResult.date : undefined,
            group: runResult.document_group !== null ? runResult.document_group : undefined,
            id: input.id,
            owner: runResult.owner,
            pdfOptions: pdfOptionsObj,
            public: runResult.public === 1,
            title: runResult.title
        };
    }
};

export interface UpdateInput {
    id: number
    title?: string
    content?: string
    authors?: string
    date?: string
    pdfOptions?: pdfOptions.PdfOptions
    resources?: CreateInputResource[]
    public?: boolean
}

/**
 * Update document.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that created the document.
 * @param input Document info.
 * @returns True if at least one element was updated otherwise False.
 */
// eslint-disable-next-line complexity
export const update = async (databasePath: string, accountId: number, input: UpdateInput): Promise<(boolean|void)> => {
    // Check if document exists
    if (!await exists(databasePath, { id: input.id })) {
        throw Error("Account does not exist");
    }
    // If ids do not match check if account that wants to access it is admin
    // TODO 1. Get document info and get owner id
    // TODO 2. Compare if same account and if not check if is admin
    // TODO 3. Add method to check for users with access permission

    const columns = [];
    const values = [];
    if (input.title) {
        columns.push("title");
        values.push(input.title);
    }
    if (input.content) {
        columns.push("content");
        values.push(input.content);
    }
    if (input.authors) {
        columns.push("authors");
        values.push(input.authors);
    }
    if (input.date) {
        columns.push("date");
        values.push(input.date);
    }
    if (input.resources) {
        // TODO
    }
    if (input.pdfOptions) {
        // TODO Do better (SQL style with custom columns/tables, sanitize input)
        columns.push("pdf_options");
        values.push(JSON.stringify(input.pdfOptions));
    }
    if (input.public !== undefined) {
        columns.push("public");
        values.push(input.public === true ? 1 : 0);
    }
    values.push(input.id);
    const postResult = await database.requests.post(
        databasePath,
        database.queries.update("document", columns, "id"),
        values
    );
    return postResult.changes > 0;
};

export interface RemoveInput {
    id: number
}

/**
 * Remove document.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that created the document.
 * @param input Document info.
 * @returns True if at least one element was removed otherwise False.
 */
export const remove = async (databasePath: string, accountId: number, input: RemoveInput): Promise<(boolean|void)> => {
    const postResult = await database.requests.post(
        databasePath,
        database.queries.remove("document", "id"),
        [input.id]
    );
    return postResult.changes > 0;
};

export interface GetAllInput {
    id: number
    getContents?: boolean
}
export interface GetAllOutput {
    id: number
    title: string
    public: boolean
    authors?: string
    date?: string
    owner: number
    group?: number
    content?: string
}
export interface GetAllFromOwnerDbOut {
    id: number
    title: string
    public: number
    authors?: string
    date?: string
    // eslint-disable-next-line camelcase
    document_group: number
    content?: string
}

export interface GetAllFromGroupDbOut {
    id: number
    public: number
    title: string
    authors?: string
    date?: string
    owner: number
    content?: string
}

/**
 * Get all documents from one author.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that created the document.
 * @param input Document get info.
 */
export const getAllFromOwner = async (
    databasePath: string, accountId: number|undefined, input: GetAllInput
): Promise<(GetAllOutput[]|void)> => {
    const columns = [ "id", "title", "authors", "date", "document_group", "public" ];
    if (input.getContents) {
        columns.push("content");
    }
    const runResults = await database.requests.getAll<GetAllFromOwnerDbOut>(
        databasePath,
        database.queries.select("document", columns, {
            whereColumn: "owner"
        }),
        [input.id]
    );
    if (runResults) {
        return runResults.map(runResult => ({
            authors: runResult.authors !== null ? runResult.authors : undefined,
            content: runResult.content,
            date: runResult.date !== null ? runResult.date : undefined,
            group: runResult.document_group !== null ? runResult.document_group : undefined,
            id: runResult.id,
            owner: input.id,
            public: runResult.public === 1,
            title: runResult.title
        }));
    }
};

/**
 * Get all documents from one author.
 *
 * @param databasePath Path to database.
 * @param accountId Unique id of account that created the document.
 * @param input Document get info.
 */
export const getAllFromGroup = async (
    databasePath: string, accountId: number|undefined, input: GetAllInput
): Promise<(GetAllOutput[]|void)> => {
    const columns = [ "id", "title", "authors", "date", "owner", "public" ];
    if (input.getContents) {
        columns.push("content");
    }
    const runResults = await database.requests.getAll<GetAllFromGroupDbOut>(
        databasePath,
        database.queries.select("document", columns, {
            whereColumn: "document_group"
        }),
        [input.id]
    );
    if (runResults) {
        return runResults.map(runResult => ({
            authors: runResult.authors,
            content: runResult.content,
            date: runResult.date,
            group: input.id,
            id: runResult.id,
            owner: runResult.owner,
            public: runResult.public === 1,
            title: runResult.title
        }));
    }
};
