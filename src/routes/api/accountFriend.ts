import * as expressMiddlewareSession from "../../middleware/expressSession";
import * as expressMiddlewareValidator from "../../middleware/expressValidator";
import * as expressValidator from "express-validator";
import * as schemaValidations from "./schemaValidations";
import type * as types from "./accountFriendTypes";
import api from "../../modules/api";
import { debuglog } from "util";
import express from "express";
import { StartExpressServerOptions } from "../../config/express";

export type { types };


const debug = debuglog("app-express-route-api-account-friend");


export default (app: express.Application, options: StartExpressServerOptions): void => {

    app.post("/api/account_friend/add",
        // Validate api input
        expressMiddlewareValidator.validateWithError(expressValidator.checkSchema({
            accountId: { isInt: true },
            apiVersion: schemaValidations.getApiVersionSupported({ couldBeString: true }),
            friendAccountId: { isInt: true }
        }), { sendJsonError: true }),
        // Check if session is authenticated
        expressMiddlewareSession.checkAuthenticationJson,
        // Try to create user
        async (req, res) => {
            debug(`Add: ${JSON.stringify(req.body)}`);
            const sessionInfo = expressMiddlewareSession.getSessionInfoAuthenticated(req);
            const request = req.body as types.AddRequestApi;
            try {
                const accountFriendEntryId = await api.database.accountFriend.create(
                    options.databasePath, sessionInfo.accountId, request
                );
                const accountInfo = await api.database.account.get(
                    options.databasePath, sessionInfo.accountId, { id: request.accountId }
                );
                const friendAccountInfo = await api.database.account.get(
                    options.databasePath, sessionInfo.accountId, { id: request.friendAccountId }
                );
                if (accountInfo && friendAccountInfo) {
                    const response: types.AddResponse = {
                        accountId: accountInfo.id,
                        accountName: accountInfo.name,
                        friendAccountId: friendAccountInfo.id,
                        friendAccountName: friendAccountInfo.name,
                        id: accountFriendEntryId
                    };
                    return res.status(200).json(response);
                }
                throw Error("There was an error during the response creation of the friend entry");
            } catch (error) {
                if (!options.production) { console.error(error); }
                return res.status(500).json({ error: (error as Error).message });
            }
        });

    app.post("/api/account_friend/addName",
        // Validate api input
        expressMiddlewareValidator.validateWithError(expressValidator.checkSchema({
            accountId: { isInt: true },
            apiVersion: schemaValidations.getApiVersionSupported({ couldBeString: true }),
            friendAccountName: { isString: true }
        }), { sendJsonError: true }),
        // Check if session is authenticated
        expressMiddlewareSession.checkAuthenticationJson,
        // Try to create user
        async (req, res) => {
            debug(`Add: ${JSON.stringify(req.body)}`);
            const sessionInfo = expressMiddlewareSession.getSessionInfoAuthenticated(req);
            const request = req.body as types.AddNameRequestApi;
            try {
                const accountFriendEntryId = await api.database.accountFriend.createName(
                    options.databasePath, sessionInfo.accountId, request
                );
                const accountInfo = await api.database.account.get(
                    options.databasePath, sessionInfo.accountId, { id: request.accountId }
                );
                const friendAccountInfo = await api.database.account.getName(
                    options.databasePath, sessionInfo.accountId, { name: request.friendAccountName }
                );
                if (accountInfo && friendAccountInfo) {
                    const response: types.AddResponse = {
                        accountId: accountInfo.id,
                        accountName: accountInfo.name,
                        friendAccountId: friendAccountInfo.id,
                        friendAccountName: friendAccountInfo.name,
                        id: accountFriendEntryId
                    };
                    return res.status(200).json(response);
                }
                throw Error("There was an error during the response creation of the friend entry");
            } catch (error) {
                if (!options.production) { console.error(error); }
                return res.status(500).json({ error: (error as Error).message });
            }
        });

    app.post("/api/account_friend/get",
        // Validate api input
        expressMiddlewareValidator.validateWithError(expressValidator.checkSchema({
            apiVersion: schemaValidations.getApiVersionSupported(),
            id: schemaValidations.getAccountFriendIdExists({
                databasePath: options.databasePath
            })
        }), { sendJsonError: true }),
        // Try to get account info
        async (req, res) => {
            debug(`Get: ${JSON.stringify(req.body)}`);
            const sessionInfo = expressMiddlewareSession.getSessionInfo(req);
            const request = req.body as types.GetRequestApi;
            try {
                const accountFriendEntryInfo = await api.database.accountFriend.get(
                    options.databasePath, sessionInfo.accountId, request
                );
                if (accountFriendEntryInfo) {
                    const response: types.GetResponse = {
                        accountId: accountFriendEntryInfo.accountId,
                        friendId: accountFriendEntryInfo.friendAccountId,
                        id: accountFriendEntryInfo.id
                    };
                    return res.status(200).json(response);
                }
                throw Error("Internal error: Account friend entry info was not returned");
            } catch (error) {
                if (!options.production) { console.error(error); }
                return res.status(500).json({ error: (error as Error).message });
            }
        });

    app.post("/api/account_friend/remove",
        // Validate api input
        expressMiddlewareValidator.validateWithError(expressValidator.checkSchema({
            apiVersion: schemaValidations.getApiVersionSupported(),
            id: schemaValidations.getAccountFriendIdExists({
                databasePath: options.databasePath
            })
        }), { sendJsonError: true }),
        // Check if session is authenticated
        expressMiddlewareSession.checkAuthenticationJson,
        // Try to remove user
        async (req, res) => {
            debug(`Remove: ${JSON.stringify(req.body)}`);
            const sessionInfo = expressMiddlewareSession.getSessionInfoAuthenticated(req);
            const request = req.body as types.RemoveRequestApi;
            try {
                const successful = await api.database.accountFriend.remove(
                    options.databasePath, sessionInfo.accountId, request
                );
                if (successful) {
                    const response: types.RemoveResponse = {
                        id: request.id
                    };
                    return res.status(200).json(response);
                }
                throw Error("Internal error: Account friend entry removal was not successful");
            } catch (error) {
                if (!options.production) { console.error(error); }
                return res.status(500).json({ error: (error as Error).message });
            }
        });

};
