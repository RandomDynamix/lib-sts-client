import fetch from 'node-fetch';
import { randomUUID } from "crypto";
import nkeys from 'ts-nkeys';
export class STSClient {
    constructor() {
        this.stsEndpoint = process.env.STS_ENDPOINT || null;
    }
    async requestServiceJWT(account, nKeySeed, stsEndpoint = this.stsEndpoint) {
        if (!account)
            throw 'Missing account identifier';
        if (!nKeySeed)
            throw 'Missing nKeySeed';
        if (!stsEndpoint)
            throw 'Missing stsEndpoint';
        const nKeyPair = nkeys.fromSeed(Buffer.from(nKeySeed));
        const requestID = randomUUID();
        const sessionResponse = await fetch(`${stsEndpoint}/authorization/session?requestID=${requestID}`);
        const sessionJSON = await sessionResponse.json();
        if (!sessionJSON?.session)
            throw 'No STS Session established';
        const stsRequest = {
            requestID: requestID,
            sessionID: sessionJSON.session,
            accountID: account,
            nKeyUser: nKeyPair.getPublicKey().toString(),
        };
        const stsRequestBuffer = Buffer.from(JSON.stringify(stsRequest));
        const stsRequestSignature = nKeyPair.sign(stsRequestBuffer);
        const stsVerification = Buffer.from(stsRequestSignature).toString('base64url');
        const stsVerifyPost = {
            method: 'POST',
            body: JSON.stringify({
                request: stsRequest,
                verification: stsVerification
            }),
            headers: { 'Content-Type': 'application/json' }
        };
        const authorizationReponse = await fetch(`${stsEndpoint}/authorization/verification`, stsVerifyPost);
        const authJSON = await authorizationReponse.json();
        if (!authJSON.token)
            throw 'STS Authorization Verification Failed';
        return authJSON.token;
    }
    async requestUserJWT(_namespace, _identity) { }
}
